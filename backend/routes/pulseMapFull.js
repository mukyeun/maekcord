const express = require('express');
const router = express.Router();
const { mapPulseTypes } = require('../utils/pulseTypeMapperFull');
const { validatePulseTypes } = require('../utils/pulseValidation');
const logger = require('../utils/logger');

router.post('/map', async (req, res) => {
  try {
    const { pvc, bv, sv, hr } = req.body;

    // 필수 파라미터 검증
    if (!pvc || !bv || !sv || !hr) {
      logger.warn('맥상 매핑 요청 누락된 파라미터', { pvc, bv, sv, hr });
      return res.status(400).json({
        success: false,
        message: '모든 맥상 파라미터(pvc, bv, sv, hr)가 필요합니다.'
      });
    }

    // 맥상 타입 유효성 검증
    const validation = validatePulseTypes(pvc, bv, sv, hr);
    if (!validation.isValid) {
      logger.warn('맥상 매핑 유효하지 않은 타입', { 
        pvc, bv, sv, hr, 
        error: validation.message 
      });
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const result = await mapPulseTypes(pvc, bv, sv, hr);
    if (!result.success) {
      logger.info('맥상 매핑 결과 없음', { pvc, bv, sv, hr });
      return res.status(404).json(result);
    }

    logger.info('맥상 매핑 성공', { 
      input: { pvc, bv, sv, hr },
      result: result.data.pulseCode 
    });
    res.json(result);
  } catch (error) {
    logger.error('맥상 매핑 API 오류', { 
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

module.exports = router; 