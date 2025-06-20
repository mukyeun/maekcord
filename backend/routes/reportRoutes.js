const express = require('express');
const router = express.Router();
const path = require('path');
const ReportGenerator = require('../utils/reportGenerator');
const logger = require('../utils/logger');

router.post('/generate', async (req, res) => {
  try {
    const reportData = req.body;

    // 데이터 유효성 검증
    if (!reportData.patientInfo || !reportData.pulseData) {
      return res.status(400).json({
        success: false,
        message: '환자 정보와 맥상 데이터가 필요합니다.'
      });
    }

    // PDF 파일명 생성 (환자이름_날짜_시간.pdf)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${reportData.patientInfo.name}_${timestamp}.pdf`;
    const outputPath = path.join(__dirname, '../reports', filename);

    // PDF 생성
    const generator = new ReportGenerator(reportData);
    const pdfPath = await generator.generate(outputPath);

    logger.info('PDF 보고서 생성 완료', {
      patient: reportData.patientInfo.name,
      path: pdfPath
    });

    // 파일 다운로드 응답
    res.download(pdfPath, filename, (err) => {
      if (err) {
        logger.error('PDF 다운로드 중 오류', { error: err.message });
        return res.status(500).json({
          success: false,
          message: 'PDF 다운로드 중 오류가 발생했습니다.'
        });
      }
    });
  } catch (error) {
    logger.error('PDF 생성 중 오류', { 
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'PDF 생성 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router; 