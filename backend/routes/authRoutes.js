const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { validateLogin, validateRegistration, validatePasswordReset } = require('../middlewares/validators');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: 사용자 인증 관련 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: "object"
 *       properties:
 *         email:
 *           type: "string"
 *           format: "email"
 *           description: "이메일"
 *         password:
 *           type: "string"
 *           format: "password"
 *           description: "비밀번호"
 *         name:
 *           type: "string"
 *           description: "이름"
 *         role:
 *           type: "string"
 *           enum: ["admin", "staff", "doctor"]
 *           default: "staff"
 *           description: "권한 유형"
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 회원가입
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 사용자 이메일
 *               password:
 *                 type: string
 *                 format: password
 *                 description: "비밀번호 (최소 6자, 문자와 숫자 포함)"
 *               name:
 *                 type: string
 *                 description: 사용자 이름
 *               role:
 *                 type: string
 *                 enum: [admin, doctor, staff]
 *                 description: "사용자 역할 (기본값: staff)"
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 회원가입이 완료되었습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT 토큰
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         role:
 *                           type: string
 *       400:
 *         description: 잘못된 요청
 *       409:
 *         description: 이메일 중복
 */
router.post('/register', validateRegistration, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 로그인
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 로그인되었습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         role:
 *                           type: string
 *       401:
 *         description: 인증 실패
 */
router.post('/login', validateLogin, authController.login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: 비밀번호 재설정 요청
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: 재설정 이메일 전송 성공
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: 비밀번호 재설정
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
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
 *               - password
 *               - passwordConfirm
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *               passwordConfirm:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 유효하지 않은 토큰
 */
router.post('/reset-password/:token', validatePasswordReset, authController.resetPassword);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 현재 사용자 정보 조회
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         role:
 *                           type: string
 *       401:
 *         description: 인증되지 않은 요청
 */
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

module.exports = router;
