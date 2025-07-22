const express = require('express');
const router = express.Router();

// v1 API 라우터들
const authRoutes = require('./authRoutes');
const patientRoutes = require('./patientRoutes');
const queueRoutes = require('./queueRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const backupRoutes = require('./backupRoutes');
const monitoringRoutes = require('./monitoringRoutes');

/**
 * @swagger
 * tags:
 *   name: API v1
 *   description: Maekcord API v1.0.0
 */

/**
 * @swagger
 * /api/v1:
 *   get:
 *     summary: API v1 정보
 *     description: API v1 버전 정보와 사용 가능한 엔드포인트를 반환합니다.
 *     tags: [API v1]
 *     responses:
 *       200:
 *         description: API 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 status:
 *                   type: string
 *                   example: "stable"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     auth:
 *                       type: string
 *                       example: "/api/v1/auth"
 *                     patients:
 *                       type: string
 *                       example: "/api/v1/patients"
 *                     queues:
 *                       type: string
 *                       example: "/api/v1/queues"
 *                     appointments:
 *                       type: string
 *                       example: "/api/v1/appointments"
 *                     backup:
 *                       type: string
 *                       example: "/api/v1/backup"
 *                     monitoring:
 *                       type: string
 *                       example: "/api/v1/monitoring"
 */
router.get('/', (req, res) => {
  res.json({
    version: '1.0.0',
    status: 'stable',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/v1/auth',
      patients: '/api/v1/patients',
      queues: '/api/v1/queues',
      appointments: '/api/v1/appointments',
      backup: '/api/v1/backup',
      monitoring: '/api/v1/monitoring'
    },
    changelog: [
      {
        version: '1.0.0',
        date: '2024-12-01',
        changes: [
          '초기 API 버전 릴리즈',
          '환자 관리 기능',
          '대기열 관리 기능',
          '예약 관리 기능',
          '백업 관리 기능',
          '모니터링 기능'
        ]
      }
    ]
  });
});

// v1 라우터 등록
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/queues', queueRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/backup', backupRoutes);
router.use('/monitoring', monitoringRoutes);

module.exports = router; 