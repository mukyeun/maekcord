const express = require('express');
const router = express.Router();
const dataExportService = require('../services/dataExportService');
const PulseDiagnosisRecord = require('../models/PulseDiagnosisRecord');
const Counter = require('../models/Counter');
const path = require('path');
const fs = require('fs').promises;

// 맥상 진단 기록 저장
router.post('/pulse-diagnosis', async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      pulseData,
      diagnosis,
      measurementContext,
      metadata
    } = req.body;

    // 기록 ID 생성
    const counter = await Counter.findOneAndUpdate(
      { name: 'pulseDiagnosisRecord' },
      { $inc: { sequence: 1 } },
      { upsert: true, new: true }
    );

    const recordId = `PD${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${counter.sequence.toString().padStart(4, '0')}`;

    // 새로운 진단 기록 생성
    const newRecord = new PulseDiagnosisRecord({
      recordId,
      patientId,
      doctorId,
      pulseData,
      diagnosis,
      measurementContext,
      metadata
    });

    await newRecord.save();

    res.status(201).json({
      success: true,
      message: '맥상 진단 기록이 저장되었습니다.',
      record: newRecord
    });

  } catch (error) {
    console.error('맥상 진단 기록 저장 오류:', error);
    res.status(500).json({
      success: false,
      message: '맥상 진단 기록 저장 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 맥상 진단 기록 조회
router.get('/pulse-diagnosis', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      patientId,
      doctorId,
      startDate,
      endDate,
      status,
      pulseType
    } = req.query;

    const query = { isActive: true };
    
    if (patientId) query.patientId = patientId;
    if (doctorId) query.doctorId = doctorId;
    if (status) query.status = status;
    if (pulseType) query['pulseData.detectedPulse'] = pulseType;
    
    if (startDate && endDate) {
      query.diagnosisDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;
    
    const records = await PulseDiagnosisRecord.find(query)
      .populate('patientId', 'basicInfo.name basicInfo.gender')
      .populate('doctorId', 'name role')
      .sort({ diagnosisDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PulseDiagnosisRecord.countDocuments(query);

    res.json({
      success: true,
      records,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        recordsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('맥상 진단 기록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '맥상 진단 기록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 맥상 진단 기록 상세 조회
router.get('/pulse-diagnosis/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await PulseDiagnosisRecord.findOne({ recordId, isActive: true })
      .populate('patientId')
      .populate('doctorId')
      .populate('review.reviewedBy', 'name role');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '해당 진단 기록을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      record
    });

  } catch (error) {
    console.error('맥상 진단 기록 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '맥상 진단 기록 상세 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 맥상 진단 기록 수정
router.put('/pulse-diagnosis/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const updateData = req.body;

    const record = await PulseDiagnosisRecord.findOneAndUpdate(
      { recordId, isActive: true },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).populate('patientId').populate('doctorId');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '해당 진단 기록을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '맥상 진단 기록이 수정되었습니다.',
      record
    });

  } catch (error) {
    console.error('맥상 진단 기록 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '맥상 진단 기록 수정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 맥상 진단 기록 삭제 (소프트 삭제)
router.delete('/pulse-diagnosis/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await PulseDiagnosisRecord.findOneAndUpdate(
      { recordId, isActive: true },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '해당 진단 기록을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '맥상 진단 기록이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('맥상 진단 기록 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '맥상 진단 기록 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 엑셀 내보내기
router.post('/export/excel', async (req, res) => {
  try {
    const exportOptions = req.body;
    
    const result = await dataExportService.exportPulseDiagnosisRecords(exportOptions);
    
    res.json({
      success: true,
      message: '엑셀 파일이 생성되었습니다.',
      ...result
    });

  } catch (error) {
    console.error('엑셀 내보내기 오류:', error);
    res.status(500).json({
      success: false,
      message: '엑셀 내보내기 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 통계 내보내기
router.post('/export/statistics', async (req, res) => {
  try {
    const exportOptions = req.body;
    
    const result = await dataExportService.exportStatistics(exportOptions);
    
    res.json({
      success: true,
      message: '통계 파일이 생성되었습니다.',
      ...result
    });

  } catch (error) {
    console.error('통계 내보내기 오류:', error);
    res.status(500).json({
      success: false,
      message: '통계 내보내기 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 백업 생성
router.post('/export/backup', async (req, res) => {
  try {
    const result = await dataExportService.createBackup();
    
    res.json({
      success: true,
      message: '백업 파일이 생성되었습니다.',
      ...result
    });

  } catch (error) {
    console.error('백업 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '백업 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 내보내기 파일 목록 조회
router.get('/export/files', async (req, res) => {
  try {
    const files = await dataExportService.getExportFiles();
    
    res.json({
      success: true,
      files
    });

  } catch (error) {
    console.error('파일 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '파일 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 파일 다운로드
router.get('/download/:fileName', (req, res) => {
  const { fileName } = req.params;
  // 'exports' 디렉토리는 프로젝트 루트에 있다고 가정합니다.
  const filePath = path.join(__dirname, '..', '..', 'exports', fileName);

  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error(`[Download Error] Failed to download ${fileName}:`, err);
      if (!res.headersSent) {
        if (err.code === 'ENOENT') {
          return res.status(404).json({ success: false, message: '요청한 파일을 찾을 수 없습니다.' });
        }
        return res.status(500).json({ success: false, message: '파일 다운로드 중 서버 오류가 발생했습니다.' });
      }
    }
  });
});

// 파일 삭제
router.delete('/export/files/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    
    const result = await dataExportService.deleteExportFile(fileName);
    
    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('파일 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '파일 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 통계 데이터 조회
router.get('/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = { isActive: true };
    
    if (startDate && endDate) {
      query.diagnosisDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // 전체 통계
    const totalRecords = await PulseDiagnosisRecord.countDocuments(query);
    
    // 맥상별 통계
    const pulseStats = await PulseDiagnosisRecord.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$pulseData.detectedPulse',
          count: { $sum: 1 },
          avgScore: { $avg: '$pulseData.matchingScore' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 일별 통계 (최근 30일)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyStats = await PulseDiagnosisRecord.aggregate([
      { 
        $match: { 
          ...query,
          diagnosisDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$diagnosisDate'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // 위험도별 통계
    const riskStats = await PulseDiagnosisRecord.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$diagnosis.riskLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      statistics: {
        totalRecords,
        pulseStats,
        dailyStats,
        riskStats
      }
    });

  } catch (error) {
    console.error('통계 데이터 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '통계 데이터 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 환자 데이터 내보내기
router.post('/export/patient-data', async (req, res) => {
  try {
    const exportOptions = req.body;
    
    const result = await dataExportService.exportPatientData(exportOptions);
    
    res.json({
      success: true,
      message: '환자 데이터 엑셀 파일이 생성되었습니다.',
      ...result
    });

  } catch (error) {
    console.error('환자 데이터 내보내기 오류:', error);
    res.status(500).json({
      success: false,
      message: '환자 데이터 내보내기 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// PDF 내보내기
router.post('/export/pdf', async (req, res) => {
  // ... (이하 생략) ...
});

module.exports = router; 