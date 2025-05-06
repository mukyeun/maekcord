/**
 * @swagger
 * tags:
 *   name: "Auth"
 *   description: "사용자 인증 및 계정 관리"
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: "http"
 *       scheme: "bearer"
 *       bearerFormat: "JWT"
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
 *           enum: ["admin", "doctor", "staff"]
 *           description: "사용자 역할 (기본값: staff)"
 *       example:
 *         email: "user@example.com"
 *         password: "Password123!"
 *         name: "홍길동"
 *         role: "staff"
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: "새 사용자 등록"
 *     tags: ["Auth"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: "object"
 *             required:
 *               - "email"
 *               - "password"
 *               - "passwordConfirm"
 *               - "name"
 *               - "role"
 *             properties:
 *               email:
 *                 type: "string"
 *                 format: "email"
 *               password:
 *                 type: "string"
 *                 format: "password"
 *               passwordConfirm:
 *                 type: "string"
 *                 format: "password"
 *               name:
 *                 type: "string"
 *               role:
 *                 type: "string"
 *                 enum: ["admin", "staff", "doctor"]
 *     responses:
 *       201:
 *         description: "사용자 등록 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 success:
 *                   type: "boolean"
 *                   example: true
 *                 token:
 *                   type: "string"
 *                   description: "JWT 토큰"
 *                 data:
 *                   $ref: "#/components/schemas/User"
 *       400:
 *         description: "잘못된 요청 (유효성 검사 실패)"
 *       409:
 *         description: "이메일 중복"
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: "사용자 로그인"
 *     tags: ["Auth"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: "object"
 *             required:
 *               - "email"
 *               - "password"
 *             properties:
 *               email:
 *                 type: "string"
 *                 format: "email"
 *               password:
 *                 type: "string"
 *                 format: "password"
 *     responses:
 *       200:
 *         description: "로그인 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 success:
 *                   type: "boolean"
 *                   example: true
 *                 token:
 *                   type: "string"
 *                   description: "JWT 토큰"
 *       401:
 *         description: "인증 실패"
 */

/**
 * @swagger
 * /api/auth/logout:
 *   get:
 *     summary: "사용자 로그아웃"
 *     tags: ["Auth"]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "로그아웃 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 success:
 *                   type: "boolean"
 *                   example: true
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: "현재 로그인한 사용자 정보 조회"
 *     tags: ["Auth"]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "사용자 정보 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 success:
 *                   type: "boolean"
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/User"
 *       401:
 *         description: "인증되지 않은 사용자"
 */

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: "비밀번호 재설정 이메일 요청"
 *     tags: ["Auth"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: "object"
 *             required:
 *               - "email"
 *             properties:
 *               email:
 *                 type: "string"
 *                 format: "email"
 *     responses:
 *       200:
 *         description: "비밀번호 재설정 이메일 전송 성공"
 *       404:
 *         description: "존재하지 않는 이메일"
 */

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   put:
 *     summary: "비밀번호 재설정"
 *     tags: ["Auth"]
 *     parameters:
 *       - in: "path"
 *         name: "token"
 *         required: true
 *         schema:
 *           type: "string"
 *         description: "비밀번호 재설정 토큰"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: "object"
 *             required:
 *               - "password"
 *               - "passwordConfirm"
 *             properties:
 *               password:
 *                 type: "string"
 *                 format: "password"
 *               passwordConfirm:
 *                 type: "string"
 *                 format: "password"
 *     responses:
 *       200:
 *         description: "비밀번호 재설정 성공"
 *       400:
 *         description: "잘못된 요청 또는 비밀번호 불일치"
 *       401:
 *         description: "유효하지 않거나 만료된 토큰"
 */ 