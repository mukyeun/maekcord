const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const validateRequest = require('../middlewares/validateRequest');
const appointmentValidation = require('../validations/appointmentValidation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { USER_ROLES } = require('../constants');
const auth = require('../middlewares/auth');
const { validateAppointment } = require('../middlewares/validators');

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: 예약 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required:
 *         - patientId
 *         - dateTime
 *         - type
 *       properties:
 *         patientId:
 *           type: string
 *           description: 환자 ID
 *         dateTime:
 *           type: string
 *           format: date-time
 *           description: 예약 일시
 *         duration:
 *           type: number
 *           description: 예약 시간 (분)
 *           default: 30
 *         type:
 *           type: string
 *           enum: [initial, follow_up, consultation, treatment, test]
 *           description: 예약 유형
 *         status:
 *           type: string
 *           enum: [scheduled, completed, cancelled, no_show]
 *           default: scheduled
 *           description: 예약 상태
 *         notes:
 *           type: string
 *           description: 메모
 */

// 일일 통계
router.get('/stats/daily', authenticateToken, appointmentController.getDoctorDailyStats);

// 월간 통계
router.get('/stats/monthly', authenticateToken, appointmentController.getDoctorMonthlyStats);

// 미들웨어 등록
router.use(authenticateToken);

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: 예약 목록 조회
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: 조회할 날짜 (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled, no_show]
 *         description: 예약 상태
 *     responses:
 *       200:
 *         description: 예약 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 */
router.get('/', appointmentController.getAppointments);

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: 예약 상세 조회
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 예약 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       404:
 *         description: 예약을 찾을 수 없음
 */
router.get('/:id', appointmentController.getAppointment);

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: 새 예약 등록
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       201:
 *         description: 예약 등록 성공
 *       400:
 *         description: 잘못된 요청
 *       409:
 *         description: 시간 중복
 */
router.post('/', auth, validateAppointment, appointmentController.createAppointment);

/**
 * @swagger
 * /api/appointments/{id}:
 *   put:
 *     summary: 예약 정보 수정
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       200:
 *         description: 예약 수정 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 예약을 찾을 수 없음
 *       409:
 *         description: 시간 중복
 */
router.put('/:id', auth, appointmentController.updateAppointment);

/**
 * @swagger
 * /api/appointments/{id}/status:
 *   put:
 *     summary: 예약 상태 변경
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [completed, cancelled, no_show]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 예약 상태 변경 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 예약을 찾을 수 없음
 */
router.put('/:id/status', auth, appointmentController.updateAppointmentStatus);

// 예약 취소
router.delete('/:id', appointmentController.cancelAppointment);

module.exports = router;