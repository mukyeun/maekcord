const express = require('express');
const router = express.Router();
const backupService = require('../services/backup.service');
const backupUtils = require('../utils/backup.utils');
const auth = require('../middlewares/auth');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const backupController = require('../controllers/backup.controller');

// 백업 서비스 시작
router.post('/start', auth.authenticateAdmin, async (req, res) => {
  try {
    backupService.startScheduledBackups();
    res.json({ success: true, message: '백업 스케줄러가 시작되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 백업 서비스 중지
router.post('/stop', auth.authenticateAdmin, async (req, res) => {
  try {
    backupService.stopScheduledBackups();
    res.json({ success: true, message: '백업 스케줄러가 중지되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 수동 백업 실행
router.post('/manual', auth.authenticateAdmin, async (req, res) => {
  try {
    const { type = 'daily' } = req.body;
    const result = await backupService.runManualBackup(type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 백업 목록 조회
router.get('/list', auth.authenticateAdmin, async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    res.json({ success: true, backups });
  } catch (error) {
    logger.error('백업 목록 조회 실패:', error);
    res.status(500).json({ success: false, error: '백업 목록 조회 실패' });
  }
});

// 수동 백업 생성
router.post('/create', auth.authenticateAdmin, async (req, res) => {
  try {
    const result = await backupService.createBackup();
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('수동 백업 생성 실패:', error);
    res.status(500).json({ success: false, error: '백업 생성 실패' });
  }
});

// 백업 복원
router.post('/restore/:filename', auth.authenticateAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    await backupService.restoreBackup(filename);
    res.json({ success: true, message: '백업 복원 완료' });
  } catch (error) {
    logger.error('백업 복원 실패:', error);
    res.status(500).json({ success: false, error: '백업 복원 실패' });
  }
});

// 백업 상태 조회
router.get('/status', auth.authenticateAdmin, async (req, res) => {
  try {
    const status = await backupController.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('백업 상태 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 수동 백업 실행
router.post('/run', auth.authenticateAdmin, async (req, res) => {
  try {
    const result = await backupController.runBackup();
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('수동 백업 실행 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 