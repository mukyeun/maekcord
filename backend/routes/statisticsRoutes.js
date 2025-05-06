const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const auth = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: 통계 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DailyStats:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           description: 날짜
 *         appointments:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *               description: 전체 예약 수
 *             completed:
 *               type: number
 *               description: 완료된 예약 수
 *             cancelled:
 *               type: number
 *               description: 취소된 예약 수
 *             noShow:
 *               type: number
 *               description: 노쇼 수
 *         waitlist:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *               description: 전체 대기자 수
 *             completed:
 *               type: number
 *               description: 진료 완료 수
 *             cancelled:
 *               type: number
 *               description: 취소 수
 *             averageWaitTime:
 *               type: number
 *               description: 평균 대기 시간 (분)
 *         patients:
 *           type: object
 *           properties:
 *             new:
 *               type: number
 *               description: 신규 환자 수
 *             revisit:
 *               type: number
 *               description: 재진 환자 수
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MonthlyStats:
 *       type: object
 *       properties:
 *         month:
 *           type: string
 *           format: YYYY-MM
 *           description: 년월
 *         appointments:
 *           type: object
 *           properties:
 *             totalByDay:
 *               type: array
 *               items:
 *                 type: number
 *               description: 일별 예약 수
 *             completedByDay:
 *               type: array
 *               items:
 *                 type: number
 *               description: 일별 완료 예약 수
 *             total:
 *               type: number
 *               description: 월 전체 예약 수
 *             avgPerDay:
 *               type: number
 *               description: 일평균 예약 수
 *         patients:
 *           type: object
 *           properties:
 *             newByDay:
 *               type: array
 *               items:
 *                 type: number
 *               description: 일별 신규 환자 수
 *             totalNew:
 *               type: number
 *               description: 월 전체 신규 환자 수
 *             totalRevisit:
 *               type: number
 *               description: 월 전체 재진 환자 수
 */

/**
 * @swagger
 * /api/statistics/daily:
 *   get:
 *     summary: 일일 통계 조회
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: 조회할 날짜 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 일일 통계 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DailyStats'
 */
router.get('/daily', auth, statisticsController.getDailyStats);

/**
 * @swagger
 * /api/statistics/monthly:
 *   get:
 *     summary: 월간 통계 조회
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           pattern: ^\d{4}-(0[1-9]|1[0-2])$
 *         description: 조회할 년월 (YYYY-MM)
 *     responses:
 *       200:
 *         description: 월간 통계 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MonthlyStats'
 */
router.get('/monthly', auth, statisticsController.getMonthlyStats);

// 의사별 통계 (관리자 전용)
router.get('/doctors/:doctorId', statisticsController.getDoctorStats);

module.exports = router; 