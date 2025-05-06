/**
 * @swagger
 * tags:
 *   name: "Statistics"
 *   description: "통계 데이터 관리"
 */

/**
 * @swagger
 * /api/statistics/daily:
 *   get:
 *     summary: "일일 통계 조회"
 *     tags: ["Statistics"]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: "query"
 *         name: "date"
 *         schema:
 *           type: "string"
 *           format: "date"
 *         required: true
 *         description: "조회할 날짜 (YYYY-MM-DD)"
 *     responses:
 *       200:
 *         description: "일일 통계 조회 성공"
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
 *                     totalAppointments:
 *                       type: "integer"
 *                       example: 25
 *                     completedAppointments:
 *                       type: "integer"
 *                       example: 20
 *                     cancelledAppointments:
 *                       type: "integer"
 *                       example: 3
 *                     noShows:
 *                       type: "integer"
 *                       example: 2
 *                     averageWaitTime:
 *                       type: "number"
 *                       example: 15.5
 *                     peakHours:
 *                       type: "array"
 *                       items:
 *                         type: "object"
 *                         properties:
 *                           hour:
 *                             type: "integer"
 *                             example: 14
 *                           count:
 *                             type: "integer"
 *                             example: 5
 */

/**
 * @swagger
 * /api/statistics/monthly:
 *   get:
 *     summary: "월간 통계 조회"
 *     tags: ["Statistics"]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: "query"
 *         name: "month"
 *         schema:
 *           type: "string"
 *         required: true
 *         description: "조회할 월 (YYYY-MM)"
 *     responses:
 *       200:
 *         description: "월간 통계 조회 성공"
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
 *                     totalPatients:
 *                       type: "integer"
 *                       example: 500
 *                     newPatients:
 *                       type: "integer"
 *                       example: 50
 *                     appointmentsByType:
 *                       type: "object"
 *                       properties:
 *                         initial:
 *                           type: "integer"
 *                           example: 100
 *                         follow_up:
 *                           type: "integer"
 *                           example: 350
 *                         consultation:
 *                           type: "integer"
 *                           example: 50
 *                     averageWaitTime:
 *                       type: "number"
 *                       example: 18.5
 *                     satisfactionRate:
 *                       type: "number"
 *                       example: 4.5
 */

/**
 * @swagger
 * /api/statistics/trends:
 *   get:
 *     summary: "추세 분석 데이터 조회"
 *     tags: ["Statistics"]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: "query"
 *         name: "type"
 *         schema:
 *           type: "string"
 *           enum: ["appointments", "patients", "waitTime"]
 *         required: true
 *         description: "분석 유형"
 *       - in: "query"
 *         name: "period"
 *         schema:
 *           type: "string"
 *           enum: ["week", "month", "quarter", "year"]
 *         required: true
 *         description: "분석 기간"
 *     responses:
 *       200:
 *         description: "추세 분석 데이터 조회 성공"
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
 *                     type: "object"
 *                     properties:
 *                       date:
 *                         type: "string"
 *                         format: "date"
 *                         example: "2024-03-20"
 *                       value:
 *                         type: "number"
 *                         example: 25
 */ 