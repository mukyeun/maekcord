const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const auth = require('../middlewares/auth');
const { validatePatient } = require('../middlewares/validators');
const Patient = require('../models/Patient');
const Queue = require('../models/Queue');
const moment = require('moment-timezone');
const mongoose = require('mongoose');

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
    const today = moment().format('YYYY-MM-DD');  // ✅ 날짜 형식 명확히 지정
    const todayStart = moment(today).startOf('day').toDate();
    const todayEnd = moment(today).endOf('day').toDate();
    
    const todayCount = await Queue.countDocuments({
      createdAt: { 
        $gte: todayStart,
        $lt: todayEnd
      }
    });

    const number = `Q${(todayCount + 1).toString().padStart(3, '0')}`;
    console.log('✅ 대기번호/날짜 생성:', { number, date: today });
    return { number, date: today };  // ✅ date 반드시 반환
  } catch (error) {
    console.error('❌ 대기번호 생성 실패:', error);
    throw new Error('대기번호 생성 실패');
  }
};

// 환자 등록 및 대기목록 추가
router.post('/', async (req, res) => {
  let savedPatient = null;
  let savedQueue = null;

  try {
    const {
      basicInfo = {},
      medication = {},
      symptoms = [],
      records = {},
      memo = ''
    } = req.body;

    // 1. 환자 정보 저장
    const patient = new Patient({
      basicInfo: {
        ...basicInfo,
        name: basicInfo.name?.trim(),
        visitType: basicInfo.visitType || '초진'
      },
      medication: {
        medications: Array.isArray(medication.medications) ? medication.medications : [],
        preferences: Array.isArray(medication.preferences) ? medication.preferences : []
      },
      symptoms: Array.isArray(symptoms) 
        ? symptoms.flatMap(item => 
            typeof item === 'string' ? item.trim() 
            : Array.isArray(item?.symptoms) ? item.symptoms.map(s => s.trim())
            : []
          )
        : [],
      records,
      memo: memo?.trim() || ''
    });

    savedPatient = await patient.save();
    console.log('✅ 환자 저장 완료:', {
      patientId: savedPatient._id,
      name: savedPatient.basicInfo?.name
    });

    // 2. 대기번호 및 날짜 생성
    const { number: queueNumber, date: queueDate } = await generateQueueNumber();
    console.log('✅ 생성된 queueDate:', queueDate);  // ✅ 값 검증

    if (!queueDate) {
      throw new Error('queueDate가 undefined입니다!');
    }

    // 3. Queue 생성
    const queueItem = new Queue({
      queueNumber,
      date: queueDate,  // ✅ 필수 필드
      patientId: savedPatient._id,
      name: savedPatient.basicInfo.name,
      visitType: savedPatient.basicInfo.visitType || '초진',
      birthDate: savedPatient.basicInfo.birthDate || null,
      phone: savedPatient.basicInfo.phone || '',
      symptoms: savedPatient.symptoms || [],
      status: 'waiting'
    });

    console.log('📌 Queue 생성 시도:', {
      queueNumber,
      date: queueDate,  // ✅ 로그에 반드시 포함
      name: queueItem.name,
      visitType: queueItem.visitType
    });

    savedQueue = await queueItem.save();
    console.log('✅ Queue 저장 완료:', {
      queueNumber: savedQueue.queueNumber,
      date: savedQueue.date,
      name: savedQueue.name
    });

    res.status(201).json({
      success: true,
      data: {
        patient: savedPatient,
        queue: savedQueue
      }
    });

  } catch (error) {
    console.error('❌ 처리 중 오류 발생:', error);
    
    // 롤백 처리
    if (savedPatient) {
      try {
        await Patient.findByIdAndDelete(savedPatient._id);
        console.log('🔄 환자 정보 롤백 완료');
      } catch (rollbackError) {
        console.error('❌ 환자 정보 롤백 실패:', rollbackError);
      }
    }

    if (savedQueue) {
      try {
        await Queue.findByIdAndDelete(savedQueue._id);
        console.log('🔄 대기목록 롤백 완료');
      } catch (rollbackError) {
        console.error('❌ 대기목록 롤백 실패:', rollbackError);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || '환자 등록 실패',
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

