const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const auth = require('../middlewares/auth');
const { validatePatient } = require('../middlewares/validators');
const Patient = require('../models/Patient');
const Queue = require('../models/Queue');
const moment = require('moment-timezone');

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: 환자 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Patient:
 *       type: object
 *       required:
 *         - name
 *         - birthDate
 *         - gender
 *         - contact
 *       properties:
 *         name:
 *           type: string
 *           description: 환자 이름
 *         birthDate:
 *           type: string
 *           format: date
 *           description: 생년월일
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *           description: 성별
 *         contact:
 *           type: object
 *           properties:
 *             phone:
 *               type: string
 *               description: 연락처
 *             email:
 *               type: string
 *               format: email
 *               description: 이메일
 *             address:
 *               type: string
 *               description: 주소
 *         medicalInfo:
 *           type: object
 *           properties:
 *             bloodType:
 *               type: string
 *               enum: [A+, A-, B+, B-, O+, O-, AB+, AB-]
 *             allergies:
 *               type: array
 *               items:
 *                 type: string
 *             medications:
 *               type: array
 *               items:
 *                 type: string
 *             conditions:
 *               type: array
 *               items:
 *                 type: string
 */

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: 환자 목록 조회
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 검색어 (이름, 연락처)
 *     responses:
 *       200:
 *         description: 환자 목록 조회 성공
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
 *                     $ref: '#/components/schemas/Patient'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get('/', auth, patientController.getPatients);

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: 환자 상세 정보 조회
 *     tags: [Patients]
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
 *         description: 환자 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       404:
 *         description: 환자를 찾을 수 없음
 */
router.get('/:id', auth, patientController.getPatient);

// 대기번호 생성 함수
const generateQueueNumber = async () => {
  try {
    let queueNumber;
    let isUnique = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    while (!isUnique && attempts < MAX_ATTEMPTS) {
      const today = moment().startOf('day').toDate();
      const count = await Queue.countDocuments({ createdAt: { $gte: today } });
      queueNumber = `Q${(count + 1).toString().padStart(3, '0')}`;
      
      const exists = await Queue.findOne({ queueNumber });
      if (!exists) {
        isUnique = true;
        console.log('✅ 대기번호 생성됨:', queueNumber);
      } else {
        attempts++;
      }
    }

    if (!isUnique) {
      throw new Error('유효한 대기번호를 생성할 수 없습니다.');
    }

    return queueNumber;
  } catch (error) {
    console.error('❌ 대기번호 생성 실패:', error);
    throw error;
  }
};

// 환자 ID 생성 함수
const generatePatientId = (residentNumber = '') => {
  const cleaned = residentNumber.replace(/[^0-9]/g, '');
  const timestamp = Date.now().toString().slice(-5);
  return cleaned.length >= 7
    ? `P${cleaned.slice(0, 7)}`
    : `P${timestamp}`;
};

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: 새 환자 등록
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       201:
 *         description: 환자 등록 성공
 *       400:
 *         description: 잘못된 요청
 */
router.post('/', async (req, res) => {
  try {
    const { basicInfo = {}, medication = {}, symptoms = [], records = {}, memo = '' } = req.body;

    // ✅ patientId는 서버에서 자동 생성되므로 제거
    if (req.body.patientId) {
      delete req.body.patientId;
      console.log('ℹ️ patientId 필드 제거됨 (서버에서 자동 생성)');
    }

    // ✅ 2. 필수 필드 검증
    const requiredFields = {
      name: '환자 이름',
      gender: '성별',
      phone: '전화번호'
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!basicInfo[field]?.trim()) {
        throw new Error(`${label}은(는) 필수입니다.`);
      }
    }

    // ✅ 3. symptoms 정제
    const flatSymptoms = Array.isArray(symptoms)
      ? symptoms.flatMap(item => {
          if (typeof item === 'string') return [item];
          if (Array.isArray(item?.symptoms)) return item.symptoms;
          return [];
        })
      : [];

    // ✅ 4. Patient 인스턴스 생성
    const patient = new Patient({
      basicInfo: {
        ...basicInfo,
        visitType: basicInfo.visitType || '초진'
      },
      medication: {
        medications: Array.isArray(medication.medications) ? medication.medications : [],
        preferences: Array.isArray(medication.preferences) ? medication.preferences : []
      },
      symptoms: flatSymptoms,
      memo: memo?.trim() || '',
      records
    });

    const savedPatient = await patient.save();
    console.log('✅ 환자 저장 완료:', {
      name: savedPatient.basicInfo.name,
      patientId: savedPatient.patientId
    });

    // ✅ 5. Queue 생성
    const queueNumber = await generateQueueNumber();
    const queueItem = new Queue({
      queueNumber,
      patientId: savedPatient._id,
      name: savedPatient.basicInfo.name,
      visitType: savedPatient.basicInfo.visitType,
      birthDate: savedPatient.basicInfo.birthDate,
      phone: savedPatient.basicInfo.phone,
      symptoms: flatSymptoms,
      status: 'waiting'
    });

    const savedQueue = await queueItem.save();
    console.log('✅ 대기 목록 추가 완료:', {
      queueNumber: savedQueue.queueNumber,
      name: savedQueue.name
    });

    res.status(201).json({
      success: true,
      patient: savedPatient,
      queue: savedQueue
    });
  } catch (error) {
    console.error('❌ 저장 중 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '저장 중 알 수 없는 오류가 발생했습니다.',
      error: error.toString()
    });
  }
});

/**
 * @swagger
 * /api/patients/{id}:
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
router.put('/:id', auth, validatePatient, patientController.updatePatient);

/**
 * @swagger
 * /api/patients/{id}/status:
 *   put:
 *     summary: 환자 상태 변경
 *     tags: [Patients]
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
 *                 enum: [active, inactive]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 환자 상태 변경 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 환자를 찾을 수 없음
 */
router.put('/:id/status', auth, patientController.updateStatus);

module.exports = router;

