const express = require('express');
const router = express.Router();
const waitlistController = require('../controllers/waitlistController');
const { authMiddleware } = require('../middlewares/auth');
const { validateWaitlist } = require('../middlewares/validators');

/**
 * @swagger
 * tags:
 *   name: Waitlist
 *   description: 대기자 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Waitlist:
 *       type: object
 *       required:
 *         - patientId
 *       properties:
 *         patientId:
 *           type: string
 *           description: 환자 ID
 *         priority:
 *           type: number
 *           description: 우선순위 (높을수록 우선)
 *           default: 1
 *         estimatedTime:
 *           type: string
 *           format: date-time
 *           description: 예상 진료 시간
 *         status:
 *           type: string
 *           enum: [waiting, called, cancelled, completed]
 *           default: waiting
 *           description: 대기 상태
 *         note:
 *           type: string
 *           description: 메모
 *         registeredAt:
 *           type: string
 *           format: date-time
 *           description: 등록 시간
 *         calledAt:
 *           type: string
 *           format: date-time
 *           description: 호출 시간
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: 완료 시간
 */

// 미들웨어 등록 - 모든 라우트에 인증 적용
router.use(authMiddleware);

/**
 * @swagger
 * /api/waitlist:
 *   get:
 *     summary: 대기자 목록 조회
 *     tags: [Waitlist]
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
 *           enum: [waiting, called, cancelled, completed]
 *         description: 대기 상태
 *       - in: query
 *         name: priority
 *         schema:
 *           type: integer
 *         description: 우선순위
 *     responses:
 *       200:
 *         description: 대기자 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Waitlist'
 */
router.get('/', waitlistController.getWaitlist);

/**
 * @swagger
 * /api/waitlist:
 *   post:
 *     summary: 대기자 등록
 *     tags: [Waitlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *             properties:
 *               patientId:
 *                 type: string
 *               priority:
 *                 type: number
 *               estimatedTime:
 *                 type: string
 *                 format: date-time
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: 대기자 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Waitlist'
 *       400:
 *         description: 잘못된 요청
 *       409:
 *         description: 이미 대기 중인 환자
 */
router.post('/', validateWaitlist, waitlistController.addToWaitlist);

/**
 * @swagger
 * /api/waitlist/{id}:
 *   put:
 *     summary: 대기 상태 변경
 *     tags: [Waitlist]
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
 *                 enum: [waiting, called, cancelled, completed]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: 상태 변경 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 대기자를 찾을 수 없음
 */
router.put('/:id', waitlistController.updateWaitlistStatus);

/**
 * @swagger
 * /api/waitlist/{id}:
 *   delete:
 *     summary: 대기자 삭제
 *     tags: [Waitlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 대기자 삭제 성공
 *       404:
 *         description: 대기자를 찾을 수 없음
 */
router.delete('/:id', waitlistController.removeFromWaitlist);

module.exports = router;