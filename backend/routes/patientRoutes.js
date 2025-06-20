const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const auth = require('../middlewares/auth');
const { validatePatient } = require('../middlewares/validators');
const Patient = require('../models/Patient');
const Queue = require('../models/Queue');
const moment = require('moment');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const generateAndSaveQueue = require('../utils/generateAndSaveQueue');

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
router.get('/', async (req, res) => {
  try {
    logger.info('📋 환자 목록 조회 시작');
    
    const patients = await Patient.find()
      .select('patientId name birthDate gender status createdAt')
      .sort({ createdAt: -1 })
      .lean();
    
    logger.info(`✅ 환자 목록 조회 성공: ${patients.length}명 조회됨`);
    logger.debug('조회된 환자 목록:', patients);

    res.json({
      success: true,
      data: patients,
      message: '환자 목록 조회 성공'
    });
  } catch (error) {
    logger.error('❌ 환자 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '환자 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

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
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('📋 환자 상세 조회 요청:', id);

    const patient = await Patient.findById(id).lean();
    
    if (!patient) {
      logger.warn('⚠️ 환자를 찾을 수 없음:', id);
      return res.status(404).json({
        success: false,
        message: '해당 환자를 찾을 수 없습니다.'
      });
    }
    
    logger.info('✅ 환자 상세 조회 성공:', patient);
    
    res.json({
      success: true,
      data: patient,
      message: '환자 상세 조회 성공'
    });
  } catch (error) {
    logger.error('❌ 환자 상세 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '환자 상세 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 환자 등록 API
router.post('/register', async (req, res) => {
  try {
    const residentNumber = req.body.basicInfo?.residentNumber;
    console.log('✅ residentNumber:', residentNumber);

    // 기존 환자 존재 확인
    const existing = await Patient.findOne({
      'basicInfo.residentNumber': residentNumber,
    });

    let patientId;
    if (existing) {
      patientId = existing.patientId;
    } else {
      patientId = await Patient.generateUniqueId();
    }
    console.log('✅ 생성된 patientId:', patientId);

    const patientData = { ...req.body, patientId };
    console.log('✅ 저장할 전체 데이터:', patientData);

    let savedPatient;
    if (existing) {
      // 먼저 patientId를 설정
      patientData.patientId = existing.patientId;
    
      // 이후 전체 덮어쓰기
      Object.assign(existing, patientData);
    
      savedPatient = await existing.save();
    } else {
      const newPatient = new Patient(patientData);
      savedPatient = await newPatient.save();
    }

    // MongoDB의 _id를 patientId로 사용
    const patientIdFromMongo = savedPatient._id;
    
    if (existing) {
      return res.status(200).json({
        success: false,
        message: '이미 등록된 환자입니다.',
        patientId: existing.patientId,
        _id: existing._id,
      });
    }
    
    res.status(201).json({ 
      success: true, 
      patientId: patientIdFromMongo,  // ObjectId 반환
      data: savedPatient 
    });
  } catch (err) {
    console.error('❌ 환자 등록 오류:', err.message);
    res.status(500).json({ message: err.message });
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
router.put('/:id', auth, patientController.updatePatient);

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

// ✅ 환자 중복 체크 API
router.post('/check', async (req, res) => {
  try {
    const residentNumber = req.body?.basicInfo?.residentNumber;
    
    if (!residentNumber) {
      return res.status(400).json({
        success: false,
        message: '주민번호가 필요합니다.'
      });
    }

    const existingPatient = await Patient.findOne({
      'basicInfo.residentNumber': residentNumber
    });

    if (existingPatient) {
      return res.json({
        exists: true,
        patientId: existingPatient.patientId,
        _id: existingPatient._id
      });
    }

    res.json({
      exists: false,
      patientId: null,
      _id: null
    });
  } catch (error) {
    logger.error('❌ 환자 중복 체크 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '환자 중복 체크 중 오류가 발생했습니다.'
    });
  }
});

router.get('/code/:patientCode', async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientCode });
    if (!patient) {
      return res.status(404).json({ message: '환자를 찾을 수 없습니다.' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;