const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const auth = require('../middlewares/auth');
const { validatePatient } = require('../middlewares/validators');
const Patient = require('../models/Patient');
const Queue = require('../models/Queue');
const moment = require('moment');
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

// 환자 등록 및 대기번호 생성 API
router.post('/register', async (req, res) => {
  try {
    // 1. 요청 데이터 전체 로깅
    console.log('📦 수신된 요청:', {
      'body 전체': JSON.stringify(req.body, null, 2),
      'basicInfo 존재': !!req.body.basicInfo,
      'name 존재': !!req.body.basicInfo?.name,
      'name 값': req.body.basicInfo?.name
    });

    // 2. 데이터 구조 분해
    const {
      basicInfo = {},
      symptoms = [],
      medication = {},
      records = {},
      memo = ''
    } = req.body;

    // 3. basicInfo 검증
    if (!basicInfo?.name?.trim()) {
      console.warn('❌ name 누락:', { basicInfo });
      return res.status(400).json({
        success: false,
        message: '환자 이름은 필수입니다.'
      });
    }

    // 4. 환자 데이터 구성
    const patientData = {
      basicInfo: {
        ...basicInfo,
        name: basicInfo.name.trim(),
        phone: basicInfo.phone || '',
        visitType: basicInfo.visitType || '초진'
      },
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      medication,
      records,
      memo
    };

    // 5. 저장 전 데이터 확인
    console.log('📝 저장할 데이터:', {
      'basicInfo.name': patientData.basicInfo.name,
      'symptoms': patientData.symptoms,
      '전체 구조': JSON.stringify(patientData, null, 2)
    });

    // 6. 환자 저장
    const newPatient = new Patient(patientData);
    const savedPatient = await newPatient.save();

    // 7. 대기번호 생성 및 저장
    const today = moment().format('YYYY-MM-DD');
    const countToday = await Queue.countDocuments({ date: today });
    const queueNumber = `Q${today.replace(/-/g, '')}-${String(countToday + 1).padStart(3, '0')}`;

    const newQueue = new Queue({
      queueNumber,
      date: today,
      patientId: savedPatient._id,
      name: savedPatient.basicInfo.name,
      phone: savedPatient.basicInfo.phone,
      birthDate: savedPatient.basicInfo.birthDate,
      visitType: savedPatient.basicInfo.visitType,
      symptoms: savedPatient.symptoms,
      status: 'waiting'
    });

    const savedQueue = await newQueue.save();

    // 8. 응답
    res.status(201).json({
      success: true,
      message: '환자 등록이 완료되었습니다.',
      data: {
        patient: savedPatient,
        queue: savedQueue
      }
    });

  } catch (error) {
    console.error('❌ 환자 등록 실패:', {
      message: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: '환자 등록 중 오류가 발생했습니다.',
      error: error.message
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