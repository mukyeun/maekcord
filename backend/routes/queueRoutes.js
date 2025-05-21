const express = require('express');
const router = express.Router();
const Queue = require('../models/Queue');
const moment = require('moment-timezone');

// 대기번호 생성 함수
const generateQueueNumber = async () => {
  const today = new Date();
  const count = await Queue.countDocuments({
    registeredAt: {
      $gte: new Date(today.setHours(0, 0, 0, 0))
    }
  });
  return `Q${(count + 1).toString().padStart(3, '0')}`;
};

// 오늘의 대기 목록 조회
router.get('/', async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const tomorrow = moment().endOf('day').toDate();

    const queue = await Queue.find({
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .sort({ createdAt: 1 })
    .populate('patientId', 'basicInfo.name basicInfo.birthDate basicInfo.phone symptoms');

    res.json({
      success: true,
      data: queue
    });
  } catch (error) {
    console.error('대기 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 대기 목록에 환자 추가
router.post('/', async (req, res) => {
  try {
    const queueNumber = await generateQueueNumber();
    const queueItem = new Queue({
      queueNumber,
      ...req.body
    });
    const savedItem = await queueItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 대기 상태 업데이트
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updatedQueue = await Queue.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!updatedQueue) {
      return res.status(404).json({ 
        success: false, 
        message: '해당 대기 항목을 찾을 수 없습니다.' 
      });
    }
    
    res.json(updatedQueue);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// 대기 목록에서 제거
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Queue.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;
