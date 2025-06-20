const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Queue = require('../models/Queue');
const Patient = require('../models/Patient');
const generateQueueNumber = require('../utils/generateQueueNumber');
const moment = require('moment');
const { broadcastQueueUpdate, broadcastPatientCalled } = require('../utils/wsServer');
const logger = require('../utils/logger');
const QueueHistory = require('../models/QueueHistory');
const { 
  registerQueue, 
  updateQueueStatus,
  getTodayQueueList,
  getQueueStatus,
  checkPatientStatus,
  getCurrentPatient,
  callQueue,
  callNextPatient
} = require('../controllers/queueController');
const { validateObjectId } = require('../middleware/validation');

// 필요한 환자 정보 필드 정의
const PATIENT_FIELDS = [
  'basicInfo.name',
  'basicInfo.gender',
  'basicInfo.phone',
  'basicInfo.birthDate',
  'symptoms',
  'status'
].join(' ');

// 활성 상태 정의
const ACTIVE_STATUSES = ['waiting', 'called', 'consulting'];

// 미들웨어: 요청/응답 로깅
router.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  // 요청 로깅
  logger.info('📥 Queue API 요청:', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
    query: Object.keys(req.query).length ? req.query : undefined
  });

  // 응답 인터셉터
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    logger.info('📤 Queue API 응답:', {
      requestId,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
    return originalJson.call(this, data);
  };

  next();
});

// 환자 호출 API - 다른 라우트보다 먼저 정의
router.put('/:id/call', callQueue);

// ✅ 기본 라우트
router.get('/', getTodayQueueList);                    // 대기열 목록 조회
router.post('/', registerQueue);                       // 대기열 등록
router.get('/today', getTodayQueueList);              // 오늘 대기 목록 조회
router.get('/status', getQueueStatus);                // 대기 현황 통계

// POST /api/queues/status - 환자별 대기 상태 조회 (POST 방식)
router.post('/status', async (req, res) => {
  const { patientId, date } = req.body;

  // 필수 파라미터 검증
  if (!patientId || !date) {
    return res.status(400).json({
      success: false,
      message: 'patientId와 date는 필수입니다.'
    });
  }

  // ObjectId 유효성 검사
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return res.status(400).json({
      success: false,
      message: '유효하지 않은 환자 ID입니다.'
    });
  }

  try {
    logger.info('🔍 환자 대기상태 조회 (POST):', {
      patientId,
      date,
      timestamp: new Date().toISOString()
    });

    // 여기서 날짜 정규화 및 중복 체크
    const normalizedDate = moment(date).startOf('day').toDate();
    const existing = await Queue.findOne({ 
      patientId, 
      date: normalizedDate,
      status: { $in: ['waiting', 'called', 'consulting'] },
      isArchived: false
    }).lean();

    logger.info('✅ 환자 대기상태 조회 완료:', {
      exists: !!existing,
      status: existing?.status,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      exists: !!existing,
      data: existing,
      message: existing ? '대기열 조회 성공' : '대기열 없음'
    });
  } catch (err) {
    logger.error('❌ 환자 대기상태 조회 오류:', {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: '서버 오류',
      error: err.message
    });
  }
});

router.get('/status/patient', async (req, res) => {   // 환자별 대기 상태 조회 (GET 방식)
  const { patientId, date } = req.query;

  // 필수 파라미터 검증
  if (!patientId || !date) {
    return res.status(400).json({
      success: false,
      message: 'patientId와 date는 필수입니다.'
    });
  }

  // ObjectId 유효성 검사
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return res.status(400).json({
      success: false,
      message: '유효하지 않은 환자 ID입니다.'
    });
  }

  try {
    logger.info('🔍 환자 대기상태 조회:', {
      patientId,
      date,
      timestamp: new Date().toISOString()
    });

    const existing = await Queue.findOne({ 
      patientId, 
      date,
      status: { $in: ['waiting', 'called', 'consulting'] },
      isArchived: false
    }).lean();

    logger.info('✅ 환자 대기상태 조회 완료:', {
      exists: !!existing,
      status: existing?.status,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      exists: !!existing,
      data: existing,
      message: existing ? '대기열 조회 성공' : '대기열 없음'
    });
  } catch (err) {
    logger.error('❌ 환자 대기상태 조회 오류:', {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: '서버 오류',
      error: err.message
    });
  }
});

// ✅ 대기열 상세 라우트
router.get('/:id/history', async (req, res) => {      // 대기 이력 조회
  try {
    const { id } = req.params;
    
    const history = await QueueHistory.find({ queueId: id })
      .sort('-changedAt')
      .populate('patientId', 'basicInfo.name');

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('대기 이력 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '이력 조회 중 오류가 발생했습니다.'
    });
  }
});

// PUT /api/queues/:queueId/status - 상태 변경
router.put('/:queueId/status', async (req, res) => {
  try {
    const { queueId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id || 'SYSTEM';

    if (!['waiting', 'called', 'consulting', 'done', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상태값입니다.'
      });
    }

    const queue = await Queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: '해당 대기열을 찾을 수 없습니다.'
      });
    }

    // 이전 상태 저장
    const previousStatus = queue.status;

    // 상태 변경
    queue.status = status;
    queue.date = queue.date || new Date();
    queue.sequenceNumber = queue.sequenceNumber || 1;
    await queue.save();

    // 이력 저장
    await QueueHistory.create({
      queueId: queue._id,
      patientId: queue.patientId,
      previousStatus,
      newStatus: status,
      changedBy: userId,
      timestamp: new Date()
    });

    // 전체 큐 목록 업데이트 브로드캐스트
    const updatedQueueList = await Queue.find({ 
      status: { $in: ACTIVE_STATUSES },
      isArchived: false 
    })
      .populate('patientId', 'basicInfo')
      .sort({ sequenceNumber: 1 })
      .lean();

    broadcastQueueUpdate(updatedQueueList);

    res.json({
      success: true,
      data: queue,
      message: '상태가 변경되었습니다.'
    });

  } catch (error) {
    logger.error('상태 변경 실패:', error);
    res.status(500).json({
      success: false,
      message: '상태 변경 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// DELETE /api/queues/:queueId - 대기열 삭제
router.delete('/:queueId', async (req, res) => {
  try {
    const { queueId } = req.params;

    // 삭제 전 대기 정보 확인
    const queue = await Queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: '해당 대기열을 찾을 수 없습니다.'
      });
    }

    // 대기 정보 저장 (로깅용)
    const queueInfo = {
      queueNumber: queue.queueNumber,
      date: queue.date,
      status: queue.status
    };

    // 삭제 실행
    await Queue.findByIdAndDelete(queueId);
    
    logger.info('✅ 대기열 삭제 완료:', queueInfo);

    // 전체 큐 목록 업데이트 브로드캐스트
    const updatedQueueList = await Queue.find({ 
      status: { $in: ACTIVE_STATUSES },
      isArchived: false 
    })
      .populate('patientId', 'basicInfo')
      .sort({ sequenceNumber: 1 })
      .lean();

    broadcastQueueUpdate(updatedQueueList);

    res.json({
      success: true,
      message: '대기열이 삭제되었습니다.',
      data: queueInfo
    });

  } catch (error) {
    logger.error('대기열 삭제 실패:', error);
    res.status(500).json({ 
      success: false, 
      message: '대기열 삭제 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

// 테스트 관련 라우트
router.get('/test', async (req, res) => {
  try {
    const allQueues = await Queue.find()
      .populate('patientId', 'basicInfo')
      .sort({ registeredAt: -1 });

    res.json({
      success: true,
      message: '전체 대기 목록 조회 성공',
      count: allQueues.length,
      data: allQueues
    });
  } catch (error) {
    logger.error('테스트 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/test-data', async (req, res) => {
  try {
    logger.info('테스트 데이터 생성 시작');

    // 기존 테스트 데이터 삭제
    await Queue.deleteMany({ isTest: true });

    // 테스트용 환자 생성
    const testPatient = new Patient({
      basicInfo: {
        name: '테스트환자',
        gender: 'male',
        birthDate: '1990-01-01',
        phoneNumber: '010-0000-0000'
      }
    });
    await testPatient.save();

    // 테스트 대기열 생성
    const testQueue = new Queue({
      patientId: testPatient._id,
      sequenceNumber: 1,
      visitType: '초진',
      status: 'waiting',
      symptoms: ['발열', '두통'],
      registeredAt: new Date(),
      date: new Date(), // ← 오늘 날짜로 고정
      isTest: true
    });

    await testQueue.save();

    const populatedQueue = await Queue.findById(testQueue._id)
      .populate('patientId', 'basicInfo');

    res.json({
      success: true,
      message: '테스트 데이터 생성 성공',
      testData: populatedQueue
    });

  } catch (error) {
    logger.error('테스트 데이터 생성 실패:', error);
    res.status(500).json({
      success: false,
      message: '테스트 데이터 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 현재 진료 중인 환자 조회
router.get('/current-patient', getCurrentPatient);

// 대기 상태 변경 라우트
router.put('/:id/status', validateObjectId, async (req, res) => {
  try {
    const { status } = req.body;
    const queueId = req.params.id;

    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: '상태 값이 필요합니다.' 
      });
    }

    const queue = await Queue.findByIdAndUpdate(
      queueId,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('patientId');

    if (!queue) {
      return res.status(404).json({ 
        success: false, 
        message: '대기열 정보를 찾을 수 없습니다.' 
      });
    }

    // WebSocket 이벤트 발생
    req.app.get('io').emit('QUEUE_UPDATE', {
      type: 'QUEUE_UPDATE',
      queue: queue,
      timestamp: queue.updatedAt
    });

    res.json({ 
      success: true, 
      message: '상태가 업데이트되었습니다.',
      data: queue 
    });
  } catch (error) {
    console.error('상태 업데이트 실패:', error);
    res.status(500).json({ 
      success: false, 
      message: '상태 업데이트 중 오류가 발생했습니다.' 
    });
  }
});

// 다음 환자 호출
router.post('/next', async (req, res) => {
  try {
    logger.info('🔍 다음 환자 호출 시작');

    // 1. 현재 날짜 범위 설정
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 2. 대기 중인 환자 찾기
    const nextQueue = await Queue.findOne({
      status: 'waiting',
      isArchived: false,
      registeredAt: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .sort({ sequenceNumeric: 1 })
    .populate('patientId', PATIENT_FIELDS);

    if (!nextQueue) {
      return res.json({
        success: true,
        data: null,
        message: '대기 중인 환자가 없습니다.'
      });
    }

    // 3. 환자 상태 업데이트
    nextQueue.status = 'called';
    nextQueue.calledAt = new Date();
    await nextQueue.save();

    // 4. 대기열 히스토리 기록
    await QueueHistory.create({
      queueId: nextQueue._id,
      patientId: nextQueue.patientId._id,
      previousStatus: 'waiting',
      newStatus: 'called',
      changedBy: req.user?.id || 'SYSTEM',
      changedAt: new Date()
    });

    // 5. WebSocket 알림 전송
    broadcastPatientCalled({
      type: 'PATIENT_CALLED',
      queueId: nextQueue._id,
      patient: {
        id: nextQueue.patientId._id,
        name: nextQueue.patientId.basicInfo.name
      },
      status: 'called',
      timestamp: new Date().toISOString()
    });

    // 6. 전체 큐 목록 업데이트 브로드캐스트
    const updatedQueueList = await Queue.find({ 
      status: { $in: ACTIVE_STATUSES },
      isArchived: false,
      registeredAt: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate('patientId', PATIENT_FIELDS)
    .sort({ sequenceNumeric: 1 })
    .lean();

    broadcastQueueUpdate(updatedQueueList);

    res.json({
      success: true,
      data: nextQueue,
      message: '다음 환자 호출 성공'
    });

  } catch (error) {
    logger.error('❌ 다음 환자 호출 실패:', error);
    res.status(500).json({
      success: false,
      message: '다음 환자 호출 중 오류가 발생했습니다.'
    });
  }
});

// 에러 핸들링 미들웨어
router.use((err, req, res, next) => {
  const errorId = Math.random().toString(36).substring(7);
  
  logger.error('❌ Queue API 에러:', {
    errorId,
    method: req.method,
    path: req.originalUrl,
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    success: false,
    errorId,
    message: '서버 내부 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = router;