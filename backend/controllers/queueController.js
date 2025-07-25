const Queue = require('../models/Queue');
const Patient = require('../models/Patient');
const generateAndSaveQueue = require('../utils/generateAndSaveQueue');
const { logger } = require('../utils/logger');
const mongoose = require('mongoose');
const QueueHistory = require('../models/QueueHistory');
const asyncHandler = require('../utils/asyncHandler');
const moment = require('moment-timezone');
const Counter = require('../models/Counter');

// 대기열 등록
exports.registerQueue = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  let responseWasSent = false;

  const timeout = setTimeout(() => {
    if (!responseWasSent) {
      responseWasSent = true;
      res.status(503).json({
        success: false,
        message: '대기열 등록 처리 시간 초과',
        error: 'TIMEOUT'
      });
    }
  }, 25000);

  try {
    console.log('🔄 대기열 등록 시작:', req.body);

    const { patientId, forceCreate = false } = req.body;
    
    // 날짜 정규화
    let momentDate;
    if (req.body.date) {
      momentDate = moment(req.body.date, 'YYYY-MM-DD').startOf('day');
    } else {
      momentDate = moment().tz('Asia/Seoul').startOf('day');
    }
    if (!momentDate.isValid()) {
      clearTimeout(timeout);
      return res.status(400).json({ success: false, message: '유효하지 않은 날짜입니다.' });
    }
    const date = momentDate.toDate();

    if (!patientId) {
      clearTimeout(timeout);
      return res.status(400).json({ success: false, message: '환자 ID가 필요합니다.' });
    }

    // 중복 체크
    const duplicate = await Queue.checkDuplicateQueue(patientId, date);
    if (duplicate && !forceCreate) {
      clearTimeout(timeout);
      return res.status(409).json({ 
        success: false, 
        message: '이미 등록된 환자입니다.',
        data: duplicate,
        canUpdate: true  // 프론트엔드에서 업데이트 가능 여부 표시
      });
    }

    // forceCreate가 true이거나 중복이 없는 경우
    if (duplicate && forceCreate) {
      // 기존 대기열 삭제
      await Queue.findByIdAndDelete(duplicate._id);
      console.log('✅ 기존 대기열 삭제 완료:', duplicate._id);
    }

    // ✅ 서버에서 순번 생성
    const finalSequenceNumber = await Queue.generateTodaySequenceNumber(date);
    const paddedSequenceNumber = String(finalSequenceNumber).padStart(3, '0');
    
    // ✅ 올바른 queueNumber 형식 생성
    const todayStr = moment(date).format('YYYYMMDD');
    const queueNumber = `Q${todayStr}-${paddedSequenceNumber}`;

    // 새 대기열 생성
    const newQueue = new Queue({
      patientId,
      visitType: req.body.visitType,
      symptoms: req.body.symptoms,
      status: req.body.status || 'waiting',
      date,
      sequenceNumber: finalSequenceNumber, // 숫자 형식의 순번 저장
      queueNumber: queueNumber, // 전체 형식의 대기열 번호 저장
      registeredAt: new Date(),
    });

    const savedQueue = await newQueue.save();

    clearTimeout(timeout);
    responseWasSent = true;
    return res.status(201).json({
      success: true,
      message: '대기열 등록 성공',
      data: {
        queueNumber: savedQueue.queueNumber,
        sequenceNumber: savedQueue.sequenceNumber,
        status: savedQueue.status,
        registeredAt: savedQueue.registeredAt
      },
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    clearTimeout(timeout);
    console.error('❌ 대기열 등록 실패:', error);

    if (!responseWasSent) {
      responseWasSent = true;
      return res.status(500).json({
        success: false,
        message: '대기열 저장 실패',
        error: error.message
      });
    }
  }
});

// 대기열 목록 조회
exports.getQueueList = asyncHandler(async (req, res) => {
  console.log('🔄 대기열 목록 조회 시작');
  
  try {
    const { date = new Date() } = req.query;
    const queues = await Queue.getQueuesByDate(date);
    
    console.log(`✅ 대기열 목록 조회 완료: ${queues.length}건`);
    
    res.json({
      success: true,
      data: queues
    });
  } catch (error) {
    console.error('❌ 대기열 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '대기열 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 오늘 대기 목록 조회
exports.getTodayQueueList = async (req, res) => {
  try {
    console.log('대기 목록 조회 시작');

    // 1. 한국 시간 기준으로 오늘 날짜 범위 설정
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('조회 날짜 범위:', {
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString()
    });

    // 2. 대기 목록 조회
    const queues = await Queue.find({
      $or: [
        { registeredAt: { $gte: today, $lt: tomorrow } },
        { date: { $gte: today, $lt: tomorrow } }
      ],
      status: { $in: ['waiting', 'called', 'consulting', 'done'] }
    })
    .populate('patientId', 'basicInfo records')
    .sort({ sequenceNumber: 1 });

    console.log('✅ 대기 목록 조회 결과:', {
      count: queues.length,
      queues: queues.map(q => ({
        _id: q._id,
        queueNumber: q.queueNumber,
        patientName: q.patientId?.basicInfo?.name,
        status: q.status
      }))
    });

    const result = queues.map(queue => {
      // patientId가 없는 경우 기본 정보만 반환
      if (!queue.patientId) {
        return {
          _id: queue._id,
          queueNumber: queue.queueNumber,
          status: queue.status,
          symptoms: queue.symptoms,
          memo: queue.memo,
          stress: queue.stress,
          pulseAnalysis: queue.pulseAnalysis,
          registeredAt: queue.registeredAt,
        };
      }

      // 각 환자의 최신 맥파 데이터 찾기
      let latestPulseWave = null;
      
      // records.pulseWave에서 직접 가져오기 (배열이 아닌 객체)
      if (queue.patientId.records && queue.patientId.records.pulseWave) {
        latestPulseWave = queue.patientId.records.pulseWave;
        console.log('✅ 환자 맥파 데이터 찾음:', {
          patientName: queue.patientId.basicInfo?.name,
          pulseWaveData: latestPulseWave
        });
      }
      // fallback: records 배열에서 찾기 (기존 방식)
      else if (queue.patientId.records && Array.isArray(queue.patientId.records) && queue.patientId.records.length > 0) {
        const recordsWithPulseWave = queue.patientId.records
          .filter(record => record.pulseWave && Object.keys(record.pulseWave).length > 0)
          .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
        
        if (recordsWithPulseWave.length > 0) {
          latestPulseWave = recordsWithPulseWave[0].pulseWave;
          console.log('✅ 환자 맥파 데이터 찾음 (배열에서):', {
            patientName: queue.patientId.basicInfo?.name,
            pulseWaveData: latestPulseWave
          });
        }
      }

      return {
        _id: queue._id,
        patientId: {
          ...queue.patientId.toObject(),
          latestPulseWave: latestPulseWave
        },
        queueNumber: queue.queueNumber,
        patientName: queue.patientId?.basicInfo?.name,
        status: queue.status,
        symptoms: queue.symptoms,
        memo: queue.memo,
        stress: queue.stress,
        pulseAnalysis: queue.pulseAnalysis,
        registeredAt: queue.registeredAt,
      };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ 오늘의 대기 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '오늘의 대기 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// ✅ 대기 상태 업데이트
exports.updateQueueStatus = asyncHandler(async (req, res) => {
  console.log('🔄 대기열 상태 변경 시작');
  
  try {
    const { queueId } = req.params;
    const { status, symptoms, memo, stress, pulseAnalysis } = req.body;
    
    const queue = await Queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: '대기열을 찾을 수 없습니다.'
      });
    }
    
    console.log('🛠 대기열 상태 업데이트 시도:', {
      queueId: queue._id,
      currentStatus: queue.status,
      newStatus: status,
      symptoms: symptoms
    });

    // Update queue fields
    queue.status = status;
    if (symptoms !== undefined) queue.symptoms = symptoms;
    if (memo !== undefined) queue.memo = memo;
    if (stress !== undefined) queue.stress = stress;
    if (pulseAnalysis !== undefined) queue.pulseAnalysis = pulseAnalysis;
    
    // Save queue changes
    await queue.save();

    // Update patient symptoms if provided
    if (symptoms !== undefined && queue.patientId) {
      try {
        const patient = await Patient.findById(queue.patientId);
        if (patient) {
          patient.symptoms = symptoms;
          await patient.save();
          console.log('✅ 환자 증상 업데이트 완료:', {
            patientId: patient._id,
            symptoms: symptoms
          });
        } else {
          console.warn('⚠️ 환자를 찾을 수 없음:', queue.patientId);
        }
      } catch (patientError) {
        console.error('❌ 환자 증상 업데이트 실패:', patientError);
        // Continue with the response even if patient update fails
      }
    }

    console.log('✅ 대기열 상태 변경 완료:', {
      queueId: queue._id,
      status,
      updatedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      data: queue
    });
  } catch (error) {
    console.error('❌ 대기열 상태 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '대기열 상태 변경 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 5분마다 실행
setInterval(async () => {
  try {
    const cleaned = await Counter.cleanupLocks();
    if (cleaned > 0) {
      console.log(`🧹 만료된 락 ${cleaned}개 정리됨`);
    }
  } catch (error) {
    console.error('락 정리 실패:', error);
  }
}, 5 * 60 * 1000);

mongoose.connection.on('error', (err) => {
  console.error('MongoDB 연결 오류:', err);
});

mongoose.connection.on('disconnected', () => {
  console.error('MongoDB 연결 끊김');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB 재연결 성공');
});

// 대기 현황 조회
exports.getQueueStatus = async (req, res) => {
  try {
    const today = moment().tz('Asia/Seoul').startOf('day').toDate();
    const tomorrow = moment(today).add(1, 'days').toDate();
    
    // 상태별 카운트 집계
    const stats = await Queue.aggregate([
      {
        $match: {
          date: {
            $gte: today,
            $lt: tomorrow
          },
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // 결과 포맷팅
    const statusCount = {
      waiting: 0,
      called: 0,
      consulting: 0,
      completed: 0,
      cancelled: 0,
      ...Object.fromEntries(stats.map(s => [s._id, s.count]))
    };

    console.log('✅ 대기현황 조회 완료:', {
      date: moment(today).format('YYYY-MM-DD'),
      stats: statusCount
    });

    res.json({
      success: true,
      data: {
        date: moment(today).format('YYYY-MM-DD'),
        stats: statusCount
      }
    });

  } catch (error) {
    console.error('❌ 대기현황 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      message: '대기현황 조회 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
};

// 환자 대기 상태 확인
exports.checkPatientStatus = async (req, res) => {
  try {
    const { patientId } = req.params;
    const today = moment().tz('Asia/Seoul').startOf('day').toDate();
    
    console.log('🔍 환자 대기상태 조회:', {
      patientId,
      date: moment(today).format('YYYY-MM-DD')
    });

    const queue = await Queue.findOne({
      patientId,
      date: today,
      status: { $in: ['waiting', 'called', 'consulting'] },
      isArchived: false
    }).populate('patientId', 'basicInfo');

    if (!queue) {
      return res.json({
        success: true,
        exists: false,
        message: '대기 중인 내역이 없습니다.'
      });
    }

    console.log('✅ 환자 대기상태 조회 완료:', {
      queueNumber: queue.queueNumber,
      status: queue.status
    });

    res.json({
      success: true,
      exists: true,
      data: {
        queueNumber: queue.queueNumber,
        sequenceNumber: queue.sequenceNumber,
        status: queue.status,
        registeredAt: queue.registeredAt,
        waitingTime: Math.floor((Date.now() - queue.registeredAt.getTime()) / (1000 * 60))
      }
    });

  } catch (error) {
    console.error('❌ 환자 대기상태 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '환자 대기상태 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 현재 진료 환자 조회
exports.getCurrentPatient = async (req, res) => {
  try {
    console.log('🔍 현재 진료 중인 환자 조회 시작');
    
    const currentQueue = await Queue.findOne({ status: 'consulting' })
      .populate({
        path: 'patientId',
        populate: {
          path: 'records'
        }
      });
    
    if (!currentQueue) {
      console.log('⚠️ 현재 진료 중인 환자가 없음');
      return res.json({ 
        success: true, 
        data: null, 
        message: '현재 진료 중인 환자가 없습니다.' 
      });
    }

    // 최신 맥파 데이터 찾기
    let latestPulseWave = null;
    
    // records.pulseWave에서 직접 가져오기 (배열이 아닌 객체)
    if (currentQueue.patientId && currentQueue.patientId.records && currentQueue.patientId.records.pulseWave) {
      latestPulseWave = currentQueue.patientId.records.pulseWave;
      console.log('✅ 최신 맥파 데이터 찾음:', {
        patientName: currentQueue.patientId.basicInfo?.name,
        pulseWaveData: latestPulseWave
      });
    }
    // fallback: records 배열에서 찾기 (기존 방식)
    else if (currentQueue.patientId && currentQueue.patientId.records && Array.isArray(currentQueue.patientId.records) && currentQueue.patientId.records.length > 0) {
      // records 배열에서 pulseWave가 있는 가장 최근 기록 찾기
      const recordsWithPulseWave = currentQueue.patientId.records
        .filter(record => record.pulseWave && Object.keys(record.pulseWave).length > 0)
        .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
      
      if (recordsWithPulseWave.length > 0) {
        latestPulseWave = recordsWithPulseWave[0].pulseWave;
        console.log('✅ 최신 맥파 데이터 찾음 (배열에서):', {
          patientName: currentQueue.patientId.basicInfo?.name,
          pulseWaveData: latestPulseWave,
          recordDate: recordsWithPulseWave[0].date || recordsWithPulseWave[0].createdAt
        });
      }
    }

    // 최신 맥파 데이터를 환자 정보에 추가
    const patientWithLatestPulseWave = {
      ...currentQueue.patientId.toObject(),
      latestPulseWave: latestPulseWave
    };

    const responseData = {
      ...currentQueue.toObject(),
      patientId: patientWithLatestPulseWave
    };
    
    console.log('✅ 현재 진료 중인 환자 조회 완료:', {
      patientName: currentQueue.patientId?.basicInfo?.name,
      queueNumber: currentQueue.queueNumber,
      hasLatestPulseWave: !!latestPulseWave
    });
    
    res.json({ 
      success: true, 
      data: responseData,
      message: '현재 진료 중인 환자 조회 성공'
    });
  } catch (error) {
    console.error('❌ 현재 진료 환자 조회 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '현재 진료 환자 조회 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
};

// callQueue 함수 정의 - 라우트와 일치하도록 수정
exports.callPatient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.error('❌ 유효하지 않은 ID 형식:', id);
    return res.status(400).json({ success: false, message: '유효하지 않은 ID 형식입니다.' });
  }

  try {
    const queue = await Queue.findById(id)
      .populate({
        path: 'patientId',
        populate: {
          path: 'records'
        }
      });

    if (!queue) {
      console.error('❌ 큐를 찾을 수 없음:', id);
      return res.status(404).json({ success: false, message: '해당 대기열을 찾을 수 없습니다.' });
    }

    // 이미 호출된 환자인지 확인
    if (queue.status === 'called') {
      console.warn('⚠️ 이미 호출된 환자:', {
        queueId: id,
        patientName: queue.patientId?.basicInfo?.name,
        status: queue.status
      });
      return res.status(400).json({ success: false, message: '이미 호출된 환자입니다.' });
    }

    // 다른 환자가 이미 호출 상태인지 확인
    const existingCalledQueue = await Queue.findOne({
      status: 'called',
      _id: { $ne: id },
      date: queue.date
    });

    if (existingCalledQueue) {
      console.warn('⚠️ 다른 환자가 이미 호출됨:', {
        existingPatient: existingCalledQueue.patientId?.basicInfo?.name,
        newPatient: queue.patientId?.basicInfo?.name
      });
      return res.status(400).json({ 
        success: false, 
        message: `이미 ${existingCalledQueue.patientId?.basicInfo?.name}님이 호출되어 있습니다.` 
      });
    }

    // 상태 변경
    const previousStatus = queue.status;
    queue.status = 'called';
    queue.calledAt = new Date();
    await queue.save();

    // 히스토리 기록
    await QueueHistory.create({
      queueId: queue._id,
      patientId: queue.patientId,
      previousStatus: previousStatus,
      newStatus: 'called',
      changedBy: req.body.changedBy || 'reception',
      timestamp: new Date()
    });

    console.log('✅ 환자 호출 완료:', {
      queueId: id,
      patientName: queue.patientId?.basicInfo?.name,
      status: queue.status,
      calledAt: queue.calledAt
    });

    res.json({ 
      success: true, 
      message: '환자 호출 완료', 
      data: queue 
    });
  } catch (error) {
    console.error('❌ 환자 호출 처리 실패:', error);
    res.status(500).json({ 
      success: false, 
      message: '환자 호출 처리 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

// 다음 환자 호출
exports.callNextPatient = asyncHandler(async (req, res) => {
  try {
    console.log('📞 다음 환자 호출 시작');

    // 1. 현재 날짜 범위 설정
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 2. 대기 중인 환자 찾기 (가장 먼저 등록된 순서)
    const nextQueue = await Queue.findOne({
      status: 'waiting',
      registeredAt: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .sort({ sequenceNumber: 1 })
    .populate({
      path: 'patientId',
      populate: {
        path: 'records'
      }
    });

    if (!nextQueue) {
      console.log('⚠️ 대기 중인 환자가 없음');
      return res.json({
        success: true,
        data: null,
        message: '대기 중인 환자가 없습니다.'
      });
    }

    // 3. 환자 정보 검증
    if (!nextQueue.patientId || !nextQueue.patientId.basicInfo || !nextQueue.patientId.basicInfo.name) {
      console.error('❌ 잘못된 환자 데이터:', {
        queueId: nextQueue._id,
        patientId: nextQueue.patientId?._id,
        patientData: nextQueue.patientId
      });
      return res.status(400).json({
        success: false,
        message: '환자 정보가 올바르지 않습니다.'
      });
    }

    // 4. 다른 환자가 이미 호출 상태인지 확인
    const existingCalledQueue = await Queue.findOne({
      status: 'called',
      _id: { $ne: nextQueue._id },
      date: nextQueue.date
    }).populate('patientId', 'basicInfo');

    if (existingCalledQueue) {
      console.warn('⚠️ 다른 환자가 이미 호출됨:', {
        existingPatient: existingCalledQueue.patientId?.basicInfo?.name,
        newPatient: nextQueue.patientId.basicInfo.name
      });
      return res.status(400).json({
        success: false,
        message: `이미 ${existingCalledQueue.patientId?.basicInfo?.name}님이 호출되어 있습니다.`
      });
    }

    // 5. 환자 상태 업데이트
    const previousStatus = nextQueue.status;
    nextQueue.status = 'called';
    nextQueue.calledAt = new Date();
    await nextQueue.save();

    // 6. 대기열 히스토리 기록
    await QueueHistory.create({
      queueId: nextQueue._id,
      patientId: nextQueue.patientId._id,
      previousStatus: previousStatus,
      newStatus: 'called',
      changedBy: req.user?.id || 'SYSTEM',
      timestamp: new Date()
    });

    console.log('✅ 다음 환자 호출 완료:', {
      queueId: nextQueue._id,
      patientName: nextQueue.patientId.basicInfo.name,
      queueNumber: nextQueue.queueNumber,
      status: nextQueue.status,
      calledAt: nextQueue.calledAt
    });

    res.json({
      success: true,
      data: nextQueue,
      message: `${nextQueue.patientId.basicInfo.name}님을 호출했습니다.`
    });
  } catch (error) {
    console.error('❌ 다음 환자 호출 실패:', error);
    res.status(500).json({
      success: false,
      message: '다음 환자 호출 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 진료 노트 저장
const saveQueueNote = async (req, res) => {
  try {
    const { queueId } = req.params;
    const { symptoms, memo, stress, pulseAnalysis, visitTime } = req.body;
    
    console.log('진료 노트 저장 요청:', {
      queueId,
      symptoms,
      hasStress: !!stress,
      hasPulseAnalysis: !!pulseAnalysis,
      providedVisitTime: visitTime,
      requestTime: moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
    });

    // 큐 정보 조회
    const queue = await Queue.findById(queueId).populate('patientId');
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: '대기열 정보를 찾을 수 없습니다.'
      });
    }

    // 입력된 방문 시간 사용 (없으면 현재 시간)
    const visitDateTime = visitTime 
      ? moment(visitTime).tz('Asia/Seoul')
      : moment().tz('Asia/Seoul');

    const finalDateTime = visitDateTime.format('YYYY-MM-DD HH:mm:ss');
    
    console.log('시간 설정:', {
      providedVisitTime: visitTime,
      finalDateTime: finalDateTime
    });
    
    const newRecord = {
      date: visitDateTime.toDate(),
      visitDateTime: visitDateTime.toDate(),
      createdAt: visitDateTime.toDate(),  // 방문 시간으로 설정
      updatedAt: visitDateTime.toDate(),  // 방문 시간으로 설정
      symptoms: symptoms || [],
      memo: memo || '',
      stress: stress || '',
      pulseAnalysis: pulseAnalysis || '',
      pulseWave: queue.patientId.latestPulseWave || {}
    };

    // 기존 records 배열이 없으면 생성
    if (!queue.patientId.records) {
      queue.patientId.records = [];
    }

    // 새 기록을 배열의 앞쪽에 추가 (최신 기록이 앞으로 오도록)
    queue.patientId.records.unshift(newRecord);

    // 환자 정보 업데이트
    await queue.patientId.save();

    console.log('진료 기록 저장 완료:', {
      patientId: queue.patientId._id,
      patientName: queue.patientId.basicInfo?.name,
      recordTime: finalDateTime,
      symptoms: symptoms
    });

    res.json({
      success: true,
      message: '진료 노트가 저장되었습니다.',
      record: newRecord,
      todayStats: {
        providedVisitTime: visitTime,
        actualRecordTime: finalDateTime
      }
    });
  } catch (error) {
    console.error('진료 노트 저장 실패:', error);
    res.status(500).json({
      success: false,
      message: '진료 노트 저장 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 오늘의 진료 기록 조회
exports.getTodayMedicalRecords = async (req, res) => {
  try {
    console.log('🔍 오늘의 진료 기록 조회 시작');

    // 오늘 자정 시간 설정
    const todayMidnight = moment().tz('Asia/Seoul').startOf('day');
    const tomorrowMidnight = moment().tz('Asia/Seoul').add(1, 'day').startOf('day');

    // 오늘 생성된 모든 큐 조회
    const todayQueues = await Queue.find({
      date: {
        $gte: todayMidnight.toDate(),
        $lt: tomorrowMidnight.toDate()
      }
    }).populate({
      path: 'patientId',
      select: 'basicInfo records'
    });

    // 오늘의 진료 기록 추출 및 가공
    const todayRecords = [];
    
    todayQueues.forEach(queue => {
      if (queue.patientId && queue.patientId.records) {
        const patientRecords = Array.isArray(queue.patientId.records) 
          ? queue.patientId.records 
          : [queue.patientId.records];

        patientRecords.forEach(record => {
          const recordTime = moment(record.visitDateTime || record.date).tz('Asia/Seoul');
          if (recordTime.isBetween(todayMidnight, tomorrowMidnight, null, '[]')) {
            todayRecords.push({
              patientName: queue.patientId.basicInfo?.name,
              patientId: queue.patientId._id,
              queueNumber: queue.queueNumber,
              visitDateTime: recordTime.format('YYYY-MM-DD HH:mm:ss'),
              symptoms: record.symptoms || [],
              memo: record.memo || '',
              stress: record.stress || '',
              pulseAnalysis: record.pulseAnalysis || ''
            });
          }
        });
      }
    });

    // 시간순으로 정렬
    todayRecords.sort((a, b) => {
      return moment(b.visitDateTime).valueOf() - moment(a.visitDateTime).valueOf();
    });

    console.log('✅ 오늘의 진료 기록 조회 완료:', {
      totalRecords: todayRecords.length,
      date: todayMidnight.format('YYYY-MM-DD')
    });

    res.json({
      success: true,
      data: {
        date: todayMidnight.format('YYYY-MM-DD'),
        totalRecords: todayRecords.length,
        records: todayRecords,
        summary: {
          uniquePatients: new Set(todayRecords.map(r => r.patientId)).size,
          recordsByHour: todayRecords.reduce((acc, record) => {
            const hour = moment(record.visitDateTime).format('HH');
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
          }, {})
        }
      }
    });

  } catch (error) {
    console.error('❌ 오늘의 진료 기록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '오늘의 진료 기록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// exports 정리
module.exports = {
  registerQueue: exports.registerQueue,
  updateQueueStatus: exports.updateQueueStatus,
  getTodayQueueList: exports.getTodayQueueList,
  getQueueStatus: exports.getQueueStatus,
  checkPatientStatus: exports.checkPatientStatus,
  getCurrentPatient: exports.getCurrentPatient,
  callPatient: exports.callPatient,
  callNextPatient: exports.callNextPatient,
  saveQueueNote,
  getTodayMedicalRecords: exports.getTodayMedicalRecords
};