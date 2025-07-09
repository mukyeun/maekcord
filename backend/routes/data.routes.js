const express = require('express');
const router = express.Router();
const dataController = require('../controllers/data.controller');
const { isAdmin, isAuthenticated } = require('../middleware/auth');

// 측정 데이터 관리
router.post('/measurements', isAuthenticated, dataController.saveMeasurement);
router.get('/measurements', isAuthenticated, dataController.getMeasurements);
router.get('/measurements/stats/:patientId', isAuthenticated, dataController.getPatientStats);
router.post('/measurements/:measurementId/analyze', isAuthenticated, dataController.analyzeMeasurement);
router.post('/measurements/:measurementId/verify', isAdmin, dataController.verifyMeasurement);
router.post('/measurements/:measurementId/archive', isAdmin, dataController.archiveMeasurement);

// 데이터 내보내기
router.get('/export', isAdmin, dataController.exportData);

module.exports = router; 