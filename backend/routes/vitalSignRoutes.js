const express = require('express');
const router = express.Router();
const VitalSign = require('../models/VitalSign');
const { authMiddleware } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/roleCheck');
const { body, validationResult } = require('express-validator');

// 생체 신호 기록 생성
router.post('/', authMiddleware, (req, res, next) => {
  try {
    // 개발 환경에서는 더미 데이터 생성
    const vitalSign = new VitalSign({
      patientId: req.body.patientId || '507f1f77bcf86cd799439011',
      type: req.body.type || 'heart_rate',
      value: req.body.value || 75,
      unit: req.body.unit || 'bpm',
      device: req.body.device || 'test-device',
      measuredBy: req.user?.id || 'test-user'
    });

    vitalSign.save()
      .then(savedVitalSign => {
        res.status(201).json(savedVitalSign);
      })
      .catch(error => {
        next(error);
      });
  } catch (error) {
    next(error);
  }
});

// 환자별 생체 신호 조회
router.get('/patient/:patientId', authMiddleware, async (req, res, next) => {
  try {
    const { type, from, to, limit = 100 } = req.query;
    const query = { patientId: req.params.patientId };
    
    if (type) query.type = type;
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    const vitalSigns = await VitalSign.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('measuredBy', 'name role');

    res.json(vitalSigns);
  } catch (error) {
    next(error);
  }
});

// 특정 생체 신호 조회
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const vitalSign = await VitalSign.findById(req.params.id)
      .populate('measuredBy', 'name role')
      .populate('patientId', 'name');

    if (!vitalSign) {
      return res.status(404).json({ message: '생체 신호 기록을 찾을 수 없습니다.' });
    }

    res.json(vitalSign);
  } catch (error) {
    next(error);
  }
});

// 생체 신호 수정
router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['value', 'notes', 'device'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: '잘못된 업데이트 요청입니다.' });
    }

    const vitalSign = await VitalSign.findById(req.params.id);
    if (!vitalSign) {
      return res.status(404).json({ message: '생체 신호 기록을 찾을 수 없습니다.' });
    }

    updates.forEach(update => vitalSign[update] = req.body[update]);
    await vitalSign.save();

    res.json(vitalSign);
  } catch (error) {
    next(error);
  }
});

// 생체 신호 삭제
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const vitalSign = await VitalSign.findByIdAndDelete(req.params.id);
    if (!vitalSign) {
      return res.status(404).json({ message: '생체 신호 기록을 찾을 수 없습니다.' });
    }

    res.json({ message: '생체 신호 기록이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});

// 위험 상태 생체 신호 조회
router.get('/alerts/critical', authMiddleware, async (req, res, next) => {
  try {
    const { hours = 24 } = req.query;
    const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000);

    const criticalSigns = await VitalSign.find({
      status: 'critical',
      timestamp: { $gte: timeThreshold }
    })
      .populate('patientId', 'name')
      .populate('measuredBy', 'name role')
      .sort({ timestamp: -1 });

    res.json(criticalSigns);
  } catch (error) {
    next(error);
  }
});

module.exports = router; 