const express = require('express');
const router = express.Router();
const PulseData = require('../models/PulseData');
const { authMiddleware } = require('../middlewares/auth');

// 맥파 데이터 저장
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    // 개발 환경에서는 더미 데이터 생성
    const pulseData = new PulseData({
      patientId: req.body.patientId || '507f1f77bcf86cd799439011',
      rawData: req.body.rawData || [1, 2, 3, 4, 5],
      samplingRate: req.body.samplingRate || 100,
      deviceInfo: req.body.deviceInfo || { name: 'test-device', version: '1.0' },
      measurementSite: req.body.measurementSite || 'finger',
      qualityScore: req.body.qualityScore || 85,
      measuredBy: req.user?.id || 'test-user'
    });

    // 맥파 분석 수행
    await pulseData.analyzePulseWave();
    
    await pulseData.save();
    res.status(201).json(pulseData);
  } catch (error) {
    next(error);
  }
});

// 환자별 맥파 데이터 조회
router.get('/patient/:patientId', authMiddleware, async (req, res, next) => {
  try {
    const { from, to, limit = 100 } = req.query;
    const query = { patientId: req.params.patientId };
    
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    const pulseData = await PulseData.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('measuredBy', 'name role');

    res.json(pulseData);
  } catch (error) {
    next(error);
  }
});

// 특정 맥파 데이터 조회
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const pulseData = await PulseData.findById(req.params.id)
      .populate('measuredBy', 'name role')
      .populate('patientId', 'name');

    if (!pulseData) {
      return res.status(404).json({ message: '맥파 데이터를 찾을 수 없습니다.' });
    }

    res.json(pulseData);
  } catch (error) {
    next(error);
  }
});

// 맥파 데이터 분석 결과 업데이트
router.patch('/:id/analysis', authMiddleware, async (req, res, next) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['heartRate', 'systolicPeak', 'diastolicPeak', 
                          'pulseTransitTime', 'augmentationIndex', 'notes'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: '잘못된 업데이트 요청입니다.' });
    }

    const pulseData = await PulseData.findById(req.params.id);
    if (!pulseData) {
      return res.status(404).json({ message: '맥파 데이터를 찾을 수 없습니다.' });
    }

    if (!pulseData.analysis) {
      pulseData.analysis = {};
    }

    updates.forEach(update => {
      pulseData.analysis[update] = req.body[update];
    });

    await pulseData.save();
    res.json(pulseData);
  } catch (error) {
    next(error);
  }
});

// 맥파 데이터 삭제
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const pulseData = await PulseData.findByIdAndDelete(req.params.id);
    if (!pulseData) {
      return res.status(404).json({ message: '맥파 데이터를 찾을 수 없습니다.' });
    }

    res.json({ message: '맥파 데이터가 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});

// 맥파 데이터 통계 조회
router.get('/stats/patient/:patientId', authMiddleware, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const query = { patientId: req.params.patientId };
    
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    const stats = await PulseData.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          avgHeartRate: { $avg: '$analysis.heartRate' },
          avgSystolicPeak: { $avg: '$analysis.systolicPeak' },
          avgDiastolicPeak: { $avg: '$analysis.diastolicPeak' },
          avgQualityScore: { $avg: '$qualityScore' },
          totalMeasurements: { $sum: 1 },
          lastMeasurement: { $max: '$timestamp' }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        message: '해당 기간에 측정된 데이터가 없습니다.',
        data: null
      });
    }

    res.json(stats[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router; 