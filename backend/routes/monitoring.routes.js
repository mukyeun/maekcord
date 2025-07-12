const express = require('express');
const router = express.Router();
const monitoringController = require('../controllers/monitoring.controller');
const { isAdmin } = require('../middlewares/auth');

// 전체 시스템 상태 조회
router.get('/status', isAdmin, monitoringController.getSystemStatus);

// 메모리 사용량 조회
router.get('/memory', isAdmin, monitoringController.getMemoryUsage);

// CPU 사용량 조회
router.get('/cpu', isAdmin, monitoringController.getCpuUsage);

// MongoDB 상태 조회
router.get('/mongodb', isAdmin, monitoringController.getMongoDBStatus);

// 애플리케이션 상태 조회
router.get('/application', isAdmin, monitoringController.getApplicationStatus);

module.exports = router; 