const express = require('express');
const router = express.Router();
const Queue = require('../models/Queue');
const { generateQueueNumber } = require('../utils/queueUtils');
const moment = require('moment');

// GET /api/queues - 대기 목록 조회
router.get('/', async (req, res) => {
  try {
    const queues = await Queue.find({ date: moment().format('YYYY-MM-DD') })
      .populate({
        path: 'patientId',
        select: 'basicInfo.name basicInfo.phone basicInfo.birthDate basicInfo.visitType'
      })
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: queues
    });
  } catch (error) {
    console.error('❌ 대기 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '대기 목록 조회 중 오류가 발생했습니다.'
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
    console.log('📞 환자 호출 요청 ID:', id);

    // ID 유효성 검사
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 대기번호 ID입니다.'
      });
    }

    const queueItem = await Queue.findById(id)
      .populate('patientId', 'basicInfo.name basicInfo.phone basicInfo.visitType')
      .lean();

    console.log('▶️ 조회된 queueItem:', queueItem);

    if (!queueItem) {
      console.warn('⚠️ 대기 항목 없음:', id);
      return res.status(404).json({
        success: false,
        message: '대기 항목을 찾을 수 없습니다.'
      });
    }

    // 환자 정보 유효성 검사
    if (!queueItem.patientId || !queueItem.patientId.basicInfo) {
      console.error('❌ 환자 정보 누락:', queueItem);
      return res.status(400).json({
        success: false,
        message: '환자 정보가 누락되어 호출할 수 없습니다.'
      });
    }

    // 이미 호출된 상태인지 확인
    if (queueItem.status === 'called') {
      return res.status(400).json({
        success: false,
        message: '이미 호출된 환자입니다.'
      });
    }

    // 이전 called 상태 환자들 초기화
    await Queue.updateMany(
      { 
        date: moment().format('YYYY-MM-DD'),
        status: 'called' 
      }, 
      { status: 'waiting' }
    );

    // 현재 환자 호출 상태로 변경
    const updatedQueue = await Queue.findByIdAndUpdate(
      id,
      { status: 'called' },
      { 
        new: true,
        runValidators: true 
      }
    ).populate('patientId', 'basicInfo.name basicInfo.phone basicInfo.visitType');

    console.log('✅ 호출 완료:', {
      queueNumber: updatedQueue.queueNumber,
      name: updatedQueue.patientId?.basicInfo?.name,
      status: updatedQueue.status
    });

    return res.json({
      success: true,
      message: '환자 호출이 완료되었습니다.',
      data: updatedQueue
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