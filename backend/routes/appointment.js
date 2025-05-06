/**
 * @swagger
 * tags:
 *   name: "Appointments"
 *   description: "진료 예약 관리"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: "object"
 *       required:
 *         - "patientId"
 *         - "dateTime"
 *         - "duration"
 *         - "type"
 *       properties:
 *         patientId:
 *           type: "string"
 *           description: "환자 ID"
 *         dateTime:
 *           type: "string"
 *           format: "date-time"
 *           description: "예약 일시"
 *         duration:
 *           type: "integer"
 *           description: "예상 진료 시간(분)"
 *         type:
 *           type: "string"
 *           enum: ["initial", "follow_up", "consultation"]
 *           description: "진료 유형"
 *         status:
 *           type: "string"
 *           enum: ["scheduled", "completed", "cancelled", "no_show"]
 *           default: "scheduled"
 *           description: "예약 상태"
 *         notes:
 *           type: "string"
 *           description: "특이사항"
 *       example:
 *         patientId: "5f7c3b3c8b2d8a1b4c7d8e9f"
 *         dateTime: "2024-03-20T14:30:00Z"
 *         duration: 30
 *         type: "initial"
 *         status: "scheduled"
 *         notes: "초진 환자"
 */

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: "예약 목록 조회"
 *     tags: ["Appointments"]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: "query"
 *         name: "date"
 *         schema:
 *           type: "string"
 *           format: "date"
 *         description: "조회할 날짜"
 *       - in: "query"
 *         name: "status"
 *         schema:
 *           type: "string"
 *           enum: ["scheduled", "completed", "cancelled", "no_show"]
 *         description: "예약 상태"
 *     responses:
 *       200:
 *         description: "예약 목록 조회 성공"
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
 *                     $ref: "#/components/schemas/Appointment"
 *   post:
 *     summary: "새 예약 생성"
 *     tags: ["Appointments"]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Appointment"
 *     responses:
 *       201:
 *         description: "예약 생성 성공"
 *       400:
 *         description: "잘못된 요청"
 *       409:
 *         description: "예약 시간 중복"
 */

/**
 * @swagger
 * /api/appointments/availability:
 *   get:
 *     summary: "예약 가능 시간 조회"
 *     tags: ["Appointments"]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: "query"
 *         name: "date"
 *         required: true
 *         schema:
 *           type: "string"
 *           format: "date"
 *         description: "조회할 날짜"
 *     responses:
 *       200:
 *         description: "예약 가능 시간 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 success:
 *                   type: "boolean"
 *                   example: true
 *                 data:
 *                   type: "object"
 *                   properties:
 *                     date:
 *                       type: "string"
 *                       format: "date"
 *                     availableSlots:
 *                       type: "array"
 *                       items:
 *                         type: "string"
 *                         format: "time"
 */

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: "특정 예약 조회"
 *     tags: ["Appointments"]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: "path"
 *         name: "id"
 *         required: true
 *         schema:
 *           type: "string"
 *         description: "예약 ID"
 *     responses:
 *       200:
 *         description: "예약 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 success:
 *                   type: "boolean"
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Appointment"
 *       404:
 *         description: "예약을 찾을 수 없음"
 */

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
 *         description: 예약 ID
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
 */ 