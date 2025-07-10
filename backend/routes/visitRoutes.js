const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const Patient = require('../models/Patient');
const Queue = require('../models/Queue');
const logger = require('../utils/logger');

// 환자의 진료 기록 목록 조회
router.get('/patients/:patientId/visits', authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // 환자 정보 조회
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: '환자를 찾을 수 없습니다.'
      });
    }

    console.log('🔍 환자 진료 기록 조회:', {
      patientId,
      patientName: patient.basicInfo?.name,
      hasRecords: patient.records != null,
      recordsCount: patient.records?.length || 0,
      recordsType: typeof patient.records,
      isArray: Array.isArray(patient.records)
    });

    // Patient 모델의 records 필드에서 진료 기록 가져오기
    let records = [];
    if (patient.records) {
      // records가 배열인지 확인하고 처리
      if (Array.isArray(patient.records)) {
        records = patient.records;
      } else {
        records = [patient.records];
      }
    }

    // 진료 기록을 날짜별로 정렬 (최신순)
    const sortedRecords = records
      .filter(record => record && (record.createdAt || record.date))
      .sort((a, b) => {
        const dateA = new Date(b.createdAt || b.date);
        const dateB = new Date(a.createdAt || a.date);
        return dateA - dateB;
      })
      .map(record => ({
        visitDateTime: record.createdAt || record.date,
        date: new Date(record.createdAt || record.date).toISOString().split('T')[0],
        symptoms: record.symptoms || [],
        memo: record.memo || '',
        stress: record.stress || '',
        pulseAnalysis: record.pulseAnalysis || '',
        pulseWave: record.pulseWave || {},
        medications: record.medications || [],
        macSang: record.macSang || {}
      }));

    console.log('✅ 처리된 진료 기록:', {
      totalRecords: sortedRecords.length,
      records: sortedRecords.map(r => ({
        dateTime: r.visitDateTime,
        date: r.date,
        hasSymptoms: r.symptoms.length > 0,
        hasPulseWave: Object.keys(r.pulseWave).length > 0
      }))
    });

    res.json({
      success: true,
      data: {
        records: sortedRecords
      }
    });
  } catch (error) {
    logger.error('진료 기록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '진료 기록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 특정 날짜의 진료 기록 상세 조회
router.get('/patients/:patientId/visits/:date', authMiddleware, async (req, res) => {
  try {
    const { patientId, date } = req.params;
    
    // 환자 정보 조회
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: '환자를 찾을 수 없습니다.'
      });
    }

    // 특정 날짜의 대기 기록 조회
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const visit = await Queue.findOne({
      patientId,
      registeredAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('patientId', 'basicInfo');

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: '해당 날짜의 진료 기록을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: visit
    });
  } catch (error) {
    logger.error('진료 기록 상세 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '진료 기록 상세 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router; 