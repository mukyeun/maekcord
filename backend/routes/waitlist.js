const express = require('express');
const router = express.Router();
const waitlistController = require('../controllers/waitlistController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: "Waitlist"
 *   description: "대기 환자 관리"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Waitlist:
 *       type: "object"
 *       required:
 *         - "patientId"
 *         - "priority"
 *         - "estimatedTime"
 *       properties:
 *         patientId:
 *           type: "string"
 *           description: "환자 ID"
 *         priority:
 *           type: "integer"
 *           minimum: 1
 *           maximum: 5
 *           description: "우선순위 (1-5, 1이 가장 높음)"
 *         estimatedTime:
 *           type: "string"
 *           format: "date-time"
 *           description: "예상 진료 시간"
 *         status:
 *           type: "string"
 *           enum: ["waiting", "called", "completed", "cancelled"]
 *           default: "waiting"
 *           description: "대기 상태"
 *         note:
 *           type: "string"
 *           description: "특이사항"
 *         waitingSince:
 *           type: "string"
 *           format: "date-time"
 *           description: "대기 시작 시간"
 *       example:
 *         patientId: "5f7c3b3c8b2d8a1b4c7d8e9f"
 *         priority: 2
 *         estimatedTime: "2024-03-20T15:30:00Z"
 *         status: "waiting"
 *         note: "발열 증상"
 *         waitingSince: "2024-03-20T15:00:00Z"
 */

/**
 * @swagger
 * /api/waitlist:
 *   get:
 *     summary: "대기 목록 조회"
 *     tags: ["Waitlist"]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: "query"
 *         name: "status"
 *         schema:
 *           type: "string"
 *           enum: ["waiting", "called", "completed", "cancelled"]
 *         description: "대기 상태 필터"
 *     responses:
 *       200:
 *         description: "대기 목록 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 success:
 *                   type: "boolean"
 *                   example: true
 *                 data:
 *                   type: "array"
 *                   items:
 *                     $ref: "#/components/schemas/Waitlist"
 *   post:
 *     summary: "대기 환자 등록"
 *     tags: ["Waitlist"]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Waitlist"
 *     responses:
 *       201:
 *         description: "대기 등록 성공"
 *       400:
 *         description: "잘못된 요청"
 */

/**
 * @swagger
 * /api/waitlist/{id}:
 *   get:
 *     summary: "특정 대기 정보 조회"
 *     tags: ["Waitlist"]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: "path"
 *         name: "id"
 *         required: true
 *         schema:
 *           type: "string"
 *         description: "대기 ID"
 *     responses:
 *       200:
 *         description: "대기 정보 조회 성공"
 *       404:
 *         description: "대기 정보를 찾을 수 없음"
 *   put:
 *     summary: "대기 상태 변경"
 *     tags: ["Waitlist"]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: "path"
 *         name: "id"
 *         required: true
 *         schema:
 *           type: "string"
 *         description: "대기 ID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: "object"
 *             required:
 *               - "status"
 *             properties:
 *               status:
 *                 type: "string"
 *                 enum: ["waiting", "called", "completed", "cancelled"]
 *               note:
 *                 type: "string"
 *     responses:
 *       200:
 *         description: "대기 상태 변경 성공"
 *       400:
 *         description: "잘못된 요청"
 *       404:
 *         description: "대기 정보를 찾을 수 없음"
 */

/**
 * @swagger
 * /api/waitlist/call/next:
 *   post:
 *     summary: "다음 대기 환자 호출"
 *     tags: ["Waitlist"]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "다음 환자 호출 성공"
 *       404:
 *         description: "대기 환자 없음"
 */

// 기존 라우트들
router.post('/', auth, waitlistController.createWaitlist);
router.get('/status', auth, waitlistController.getWaitlistStatus);

// 상태 업데이트 라우트
router.patch('/:id/status', auth, waitlistController.updateWaitlistStatus);

module.exports = router; 