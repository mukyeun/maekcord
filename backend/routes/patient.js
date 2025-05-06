/**
 * @swagger
 * tags:
 *   name: "Patients"
 *   description: "환자 정보 관리"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Patient:
 *       type: "object"
 *       required:
 *         - "name"
 *         - "birthDate"
 *         - "gender"
 *         - "contact"
 *       properties:
 *         name:
 *           type: "string"
 *           description: "환자 이름"
 *         birthDate:
 *           type: "string"
 *           format: "date"
 *           description: "생년월일"
 *         gender:
 *           type: "string"
 *           enum: ["male", "female", "other"]
 *           description: "성별"
 *         contact:
 *           type: "object"
 *           properties:
 *             phone:
 *               type: "string"
 *               description: "연락처"
 *             email:
 *               type: "string"
 *               format: "email"
 *               description: "이메일"
 *             address:
 *               type: "string"
 *               description: "주소"
 *         medicalInfo:
 *           type: "object"
 *           properties:
 *             bloodType:
 *               type: "string"
 *               enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
 *             allergies:
 *               type: "array"
 *               items:
 *                 type: "string"
 *             medications:
 *               type: "array"
 *               items:
 *                 type: "string"
 *             conditions:
 *               type: "array"
 *               items:
 *                 type: "string"
 *         registeredAt:
 *           type: "string"
 *           format: "date-time"
 *           description: "등록일"
 *       example:
 *         name: "홍길동"
 *         birthDate: "1990-01-01"
 *         gender: "male"
 *         contact:
 *           phone: "010-1234-5678"
 *           email: "patient@example.com"
 *           address: "서울시 강남구"
 *         medicalInfo:
 *           bloodType: "A+"
 *           allergies: ["penicillin"]
 *           medications: ["aspirin"]
 *           conditions: ["hypertension"]
 */

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: "환자 목록 조회"
 *     tags: ["Patients"]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: "query"
 *         name: "page"
 *         schema:
 *           type: "integer"
 *           default: 1
 *         description: "페이지 번호"
 *       - in: "query"
 *         name: "limit"
 *         schema:
 *           type: "integer"
 *           default: 10
 *         description: "페이지당 항목 수"
 *       - in: "query"
 *         name: "search"
 *         schema:
 *           type: "string"
 *         description: "검색어 (이름, 연락처)"
 *     responses:
 *       200:
 *         description: "환자 목록 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 success:
 *                   type: "boolean"
 *                   example: true
 *                 count:
 *                   type: "integer"
 *                 pagination:
 *                   type: "object"
 *                   properties:
 *                     page:
 *                       type: "integer"
 *                     limit:
 *                       type: "integer"
 *                     totalPages:
 *                       type: "integer"
 *                     total:
 *                       type: "integer"
 *                 data:
 *                   type: "array"
 *                   items:
 *                     $ref: "#/components/schemas/Patient"
 *   post:
 *     summary: "새 환자 등록"
 *     tags: ["Patients"]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Patient"
 *     responses:
 *       201:
 *         description: "환자 등록 성공"
 *       400:
 *         description: "잘못된 요청"
 */

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: "특정 환자 정보 조회"
 *     tags: ["Patients"]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: "path"
 *         name: "id"
 *         required: true
 *         schema:
 *           type: "string"
 *         description: "환자 ID"
 *     responses:
 *       200:
 *         description: "환자 정보 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 success:
 *                   type: "boolean"
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Patient"
 *       404:
 *         description: "환자를 찾을 수 없음"
 *   put:
 *     summary: 환자 정보 수정
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 환자 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       200:
 *         description: 환자 정보 수정 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 환자를 찾을 수 없음
 */ 