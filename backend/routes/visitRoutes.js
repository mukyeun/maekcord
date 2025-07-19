const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');
const { authenticateToken } = require('../middlewares/auth');

// 환자의 진료 기록 목록 조회
router.get('/patients/:patientId/visits', authenticateToken, visitController.getPatientVisitHistory);

// 특정 날짜의 진료 기록 상세 조회
router.get('/patients/:patientId/visits/:date', authenticateToken, visitController.getPatientVisitRecord);

module.exports = router; 