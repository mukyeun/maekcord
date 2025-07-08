const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const PulseData = require('../models/PulseData');

// 환자 검색 API
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const patients = await Patient.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { patientId: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);

    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    console.error('환자 검색 실패:', error);
    res.status(500).json({
      success: false,
      message: '환자 검색 중 오류가 발생했습니다.'
    });
  }
});

// 환자의 맥진 기록 조회 API
router.get('/:patientId/pulse-history', async (req, res) => {
  try {
    const { patientId } = req.params;
    const pulseHistory = await PulseData.find({ patientId })
      .sort({ timestamp: -1 })
      .limit(7);

    res.json({
      success: true,
      data: pulseHistory
    });
  } catch (error) {
    console.error('맥진 기록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '맥진 기록 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router; 