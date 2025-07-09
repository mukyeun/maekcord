const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecordController');
const { authMiddleware } = require('../middlewares/auth');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const MedicalRecord = require('../models/MedicalRecord');

/**
 * @swagger
 * tags:
 *   name: MedicalRecords
 *   description: 진료 기록 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MedicalRecord:
 *       type: object
 *       required:
 *         - patientId
 *         - diagnosis
 *         - treatment
 *       properties:
 *         patientId:
 *           type: string
 *           description: 환자 ID
 *         doctorId:
 *           type: string
 *           description: 의사 ID
 *         visitDate:
 *           type: string
 *           format: date-time
 *           description: 진료 일시
 *         diagnosis:
 *           type: string
 *           description: 진단 내용
 *         treatment:
 *           type: string
 *           description: 치료 내용
 *         prescription:
 *           type: string
 *           description: 처방 내용
 *         notes:
 *           type: string
 *           description: 특이사항
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *           description: 첨부 파일 목록
 */

// 미들웨어 등록 - 모든 라우트에 인증 적용
router.use(authMiddleware);

/**
 * @swagger
 * /api/medical-records:
 *   post:
 *     summary: 진료 기록 생성
 *     tags: [MedicalRecords]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MedicalRecord'
 *     responses:
 *       201:
 *         description: 진료 기록 생성 성공
 *       400:
 *         description: 잘못된 요청
 *       403:
 *         description: 권한 없음
 */
router.post('/', medicalRecordController.createRecord);

/**
 * @swagger
 * /api/medical-records/{recordId}:
 *   get:
 *     summary: 진료 기록 조회
 *     tags: [MedicalRecords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 진료 기록 조회 성공
 *       404:
 *         description: 기록을 찾을 수 없음
 */
router.get('/:recordId', medicalRecordController.getRecord);

/**
 * @swagger
 * /api/medical-records/patient/{patientId}:
 *   get:
 *     summary: 환자의 진료 기록 목록 조회
 *     tags: [MedicalRecords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 진료 기록 목록 조회 성공
 */
router.get('/patient/:patientId', medicalRecordController.getPatientRecords);

/**
 * @swagger
 * /api/medical-records/doctor/{doctorId}:
 *   get:
 *     summary: 의사의 진료 기록 목록 조회
 *     tags: [MedicalRecords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 진료 기록 목록 조회 성공
 *       403:
 *         description: 권한 없음
 */
router.get('/doctor/:doctorId', medicalRecordController.getDoctorRecords);

/**
 * @swagger
 * /api/medical-records/{recordId}:
 *   put:
 *     summary: 진료 기록 수정
 *     tags: [MedicalRecords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MedicalRecord'
 *     responses:
 *       200:
 *         description: 진료 기록 수정 성공
 *       400:
 *         description: 잘못된 요청
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 기록을 찾을 수 없음
 */
router.put('/:recordId', medicalRecordController.updateRecord);

/**
 * @swagger
 * /api/medical-records/{recordId}:
 *   delete:
 *     summary: 진료 기록 삭제
 *     tags: [MedicalRecords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 진료 기록 삭제 성공
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 기록을 찾을 수 없음
 */
router.delete('/:recordId', medicalRecordController.deleteRecord);

// 진료 기록 수정 API
router.patch('/:recordId', async (req, res, next) => {
  try {
    const { recordId } = req.params;
    const updateData = req.body;
    
    // 수정 권한 확인
    if (!req.user.isDoctor && !req.user.isAdmin) {
      throw new AppError('진료 기록 수정 권한이 없습니다.', 403);
    }

    // 진료 기록 존재 여부 확인
    const existingRecord = await MedicalRecord.findById(recordId);
    if (!existingRecord) {
      throw new AppError('해당 진료 기록을 찾을 수 없습니다.', 404);
    }

    // 수정 이력 추가
    const revision = {
      modifiedBy: req.user._id,
      modifiedAt: new Date(),
      changes: {
        before: JSON.stringify(existingRecord),
        after: JSON.stringify(updateData)
      }
    };

    // 기존 수정 이력이 없으면 배열 생성
    if (!existingRecord.revisions) {
      existingRecord.revisions = [];
    }

    // 수정 이력 추가
    existingRecord.revisions.push(revision);

    // 데이터 업데이트
    Object.keys(updateData).forEach(key => {
      if (key !== 'revisions' && key !== '_id' && key !== 'createdAt') {
        existingRecord[key] = updateData[key];
      }
    });

    // 수정일 업데이트
    existingRecord.updatedAt = new Date();

    // 저장
    await existingRecord.save();

    logger.info(`✅ 진료 기록 수정 완료 (ID: ${recordId})`);

    res.json({
      success: true,
      message: '진료 기록이 성공적으로 수정되었습니다.',
      data: existingRecord
    });

  } catch (error) {
    next(error);
  }
});

// 진료 기록 수정 이력 조회 API
router.get('/:recordId/revisions', async (req, res, next) => {
  try {
    const { recordId } = req.params;

    const record = await MedicalRecord.findById(recordId)
      .populate('revisions.modifiedBy', 'name role');

    if (!record) {
      throw new AppError('해당 진료 기록을 찾을 수 없습니다.', 404);
    }

    res.json({
      success: true,
      data: record.revisions || []
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router; 