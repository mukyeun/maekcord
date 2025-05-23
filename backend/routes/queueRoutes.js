const express = require('express');
const router = express.Router();
const Queue = require('../models/Queue');
const { generateQueueNumber } = require('../utils/queueUtils');
const moment = require('moment-timezone');

// GET /api/queues?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    
    const queues = await Queue.find({ date: today })
      .sort({ createdAt: 1 })
      .populate('patientId', 'basicInfo.name basicInfo.phone basicInfo.visitType')
      .lean();

    // 디버깅 로그
    console.log('✅ 대기 목록 조회:', {
      날짜: today,
      총인원: queues.length,
      '첫번째 환자이름': queues[0]?.patientId?.basicInfo?.name || '없음',
      '대기중': queues.filter(q => q.status === 'waiting').length,
      '진료중': queues.filter(q => q.status === 'in-progress').length,
      '완료': queues.filter(q => q.status === 'done').length
    });

    // 전체 객체 그대로 반환 (populate된 상태)
    res.status(200).json({
      success: true,
      date: today,
      count: queues.length,
      data: queues
    });

  } catch (error) {
    console.error('❌ 대기 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '대기 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// GET /api/queues/status - 대기 현황 통계
router.get('/status', async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    
    const stats = await Queue.aggregate([
      { $match: { date: today } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    const statusCount = {
      waiting: 0,
      'in-progress': 0,
      completed: 0,
      cancelled: 0,
      ...Object.fromEntries(stats.map(s => [s._id, s.count]))
    };

    console.log('✅ 대기현황 조회:', statusCount);

    res.status(200).json({
      success: true,
      date: today,
      stats: statusCount
    });

  } catch (error) {
    console.error('❌ 대기현황 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      message: '대기현황 조회 실패',
      error: error.message 
    });
  }
});

// 대기 목록에 환자 추가
router.post('/', async (req, res) => {
  try {
    console.log('🔄 대기 목록 추가 시작:', req.body);

    // 대기번호 생성
    const queueNumber = await generateQueueNumber();
    
    // 새 대기 항목 생성
    const queueItem = new Queue({
      queueNumber,
      patientId: req.body.patientId,
      status: 'waiting',
      createdAt: new Date()
    });

    // 저장
    const savedItem = await queueItem.save();
    console.log('✅ 대기 목록 추가 완료:', savedItem);

    // 환자 정보와 함께 응답
    const populatedItem = await Queue.findById(savedItem._id)
      .populate('patientId', 'basicInfo.name basicInfo.birthDate basicInfo.phone symptoms');

    res.status(201).json({
      success: true,
      data: populatedItem
    });
  } catch (error) {
    console.error('❌ 대기 목록 추가 실패:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 환자 호출
router.put('/:id/call', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📞 환자 호출 요청:', id);

    const queueItem = await Queue.findById(id)
      .populate('patientId', 'basicInfo.name');
      
    if (!queueItem) {
      return res.status(404).json({
        success: false,
        message: '대기 항목을 찾을 수 없습니다.'
      });
    }

    // 이전 호출 상태 초기화
    await Queue.updateMany(
      { status: 'called' },
      { status: 'waiting' }
    );

    // 현재 환자 호출
    queueItem.status = 'called';
    await queueItem.save();

    console.log('✅ 환자 호출 완료:', {
      queueNumber: queueItem.queueNumber,
      patientName: queueItem.patientId?.basicInfo?.name
    });

    res.json({
      success: true,
      data: queueItem
    });
  } catch (error) {
    console.error('❌ 환자 호출 실패:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 상태 업데이트 라우트 수정
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log('🔄 상태 업데이트 요청:', { id, status });

    // 진료중으로 변경 시 기존 진료중 환자 상태 변경
    if (status === 'in-progress') {
      await Queue.updateMany(
        { status: 'in-progress' },
        { status: 'waiting' }
      );
    }

    const updatedQueue = await Queue.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('patientId', 'basicInfo.name basicInfo.birthDate basicInfo.phone symptoms');

    if (!updatedQueue) {
      console.log('❌ 대기 항목 없음:', id);
      return res.status(404).json({
        success: false,
        message: '해당 대기 항목을 찾을 수 없습니다.'
      });
    }

    console.log('✅ 상태 업데이트 완료:', updatedQueue);
    res.json({
      success: true,
      data: updatedQueue
    });
  } catch (error) {
    console.error('❌ 상태 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE /api/queues/:id
router.delete('/:id', async (req, res) => {
  try {
    const queueId = req.params.id;
    console.log('🗑️ 대기 삭제 시도:', queueId);

    // 삭제 전 대기 정보 확인
    const queue = await Queue.findById(queueId);
    if (!queue) {
      console.log('❌ 대기 항목 없음:', queueId);
      return res.status(404).json({
        success: false,
        message: '해당 대기번호를 찾을 수 없습니다.'
      });
    }

    // 대기 정보 저장 (로깅용)
    const queueInfo = {
      queueNumber: queue.queueNumber,
      date: queue.date,
      name: queue.name,
      status: queue.status
    };

    // 삭제 실행
    await Queue.findByIdAndDelete(queueId);
    
    console.log('✅ 대기 삭제 완료:', queueInfo);

    res.status(200).json({
      success: true,
      message: '대기 항목이 삭제되었습니다.',
      data: queueInfo
    });

  } catch (error) {
    console.error('❌ 대기 삭제 실패:', error);
    res.status(500).json({ 
      success: false, 
      message: '대기 삭제 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

// PUT /api/queues/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const queueId = req.params.id;
    const { status } = req.body;

    // 상태값 유효성 검사
    const validStatuses = ['waiting', 'called', 'in-progress', 'done', 'no-show', 'cancelled'];
    if (!validStatuses.includes(status)) {
      console.log('❌ 잘못된 상태값:', status);
      return res.status(400).json({
        success: false,
        message: `유효하지 않은 상태값입니다. 가능한 값: ${validStatuses.join(', ')}`
      });
    }

    // 대기 항목 존재 여부 확인
    const queue = await Queue.findById(queueId);
    if (!queue) {
      console.log('❌ 대기 항목 없음:', queueId);
      return res.status(404).json({
        success: false,
        message: '해당 대기번호를 찾을 수 없습니다.'
      });
    }

    // 상태 업데이트
    const previousStatus = queue.status;
    queue.status = status;
    
    if (status === 'done' || status === 'no-show') {
      queue.completedAt = new Date();
    }

    const updated = await queue.save();
    
    console.log('✅ 상태 변경 완료:', {
      queueNumber: queue.queueNumber,
      from: previousStatus,
      to: status
    });

    res.status(200).json({
      success: true,
      message: '대기 상태가 변경되었습니다.',
      data: {
        queueNumber: updated.queueNumber,
        previousStatus,
        currentStatus: updated.status,
        updatedAt: updated.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ 대기 상태 변경 실패:', error);
    res.status(500).json({ 
      success: false, 
      message: '대기 상태 변경 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

// 오늘 대기 목록 조회
router.get('/today', async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    
    const queueList = await Queue.find({ date: today })
      .sort({ createdAt: 1 })
      .populate('patientId', 'basicInfo.name basicInfo.phone basicInfo.visitType')
      .lean();

    console.log('✅ 대기 목록 조회:', {
      날짜: today,
      총인원: queueList.length,
      '대기중': queueList.filter(q => q.status === 'waiting').length,
      '진료중': queueList.filter(q => q.status === 'in-progress').length,
      '완료': queueList.filter(q => q.status === 'done').length,
      '첫번째 환자': queueList[0]?.patientId?.basicInfo?.name || '없음'
    });

    res.json({
      success: true,
      message: '대기 목록 조회 성공',
      data: queueList
    });

  } catch (error) {
    console.error('❌ 대기 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '대기 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 상태 변경 API
router.patch('/:queueId/status', async (req, res) => {
  try {
    const { queueId } = req.params;
    const { status } = req.body;

    if (!['waiting', 'in-progress', 'done'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상태값입니다.'
      });
    }

    const updatedQueue = await Queue.findByIdAndUpdate(
      queueId,
      { status },
      { new: true }
    )
    .populate('patientId', 'basicInfo.name basicInfo.phone basicInfo.visitType')
    .lean();

    if (!updatedQueue) {
      return res.status(404).json({
        success: false,
        message: '해당 대기번호를 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      message: '상태 변경 성공',
      data: updatedQueue  // populate된 전체 객체 반환
    });

  } catch (error) {
    console.error('❌ 상태 변경 실패:', error);
    res.status(500).json({
      success: false,
      message: '상태 변경 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;