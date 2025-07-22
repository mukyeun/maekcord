const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validatePatient } = require('../middlewares/validators');
const Patient = require('../models/Patient');
const PatientData = require('../models/PatientData');
const Queue = require('../models/Queue');
const moment = require('moment');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const generateAndSaveQueue = require('../utils/generateAndSaveQueue');
const { exec } = require('child_process');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(require('child_process').exec);
const fs = require('fs');
const XLSX = require('xlsx');

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
 *         - basicInfo
 *       properties:
 *         _id:
 *           type: string
 *           description: 환자 고유 ID
 *         basicInfo:
 *           type: object
 *           required:
 *             - name
 *             - gender
 *             - phone
 *           properties:
 *             name:
 *               type: string
 *               description: 환자 이름
 *             gender:
 *               type: string
 *               enum: [male, female]
 *               description: 성별
 *             birthDate:
 *               type: string
 *               format: date
 *               description: 생년월일
 *             phone:
 *               type: string
 *               description: 연락처
 *             residentNumber:
 *               type: string
 *               description: 주민등록번호
 *             personality:
 *               type: string
 *               description: 성격
 *             workIntensity:
 *               type: string
 *               description: 업무 강도
 *             height:
 *               type: number
 *               description: 키 (cm)
 *             weight:
 *               type: number
 *               description: 체중 (kg)
 *             bmi:
 *               type: number
 *               description: 체질량지수
 *             visitType:
 *               type: string
 *               enum: [초진, 재진]
 *               default: 초진
 *               description: 방문 유형
 *         medicalInfo:
 *           type: object
 *           properties:
 *             allergies:
 *               type: array
 *               items:
 *                 type: string
 *               description: 알레르기 목록
 *             medications:
 *               type: array
 *               items:
 *                 type: string
 *               description: 복용 중인 약물
 *             medicalHistory:
 *               type: array
 *               items:
 *                 type: string
 *               description: 과거 병력
 *         stress:
 *           type: object
 *           properties:
 *             level:
 *               type: string
 *               enum: [low, medium, high]
 *               description: 스트레스 수준
 *             score:
 *               type: number
 *               description: 스트레스 점수
 *             items:
 *               type: array
 *               items:
 *                 type: object
 *               description: 스트레스 항목
 *             details:
 *               type: string
 *               description: 스트레스 상세 설명
 *         pulseWave:
 *           type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 type: number
 *               description: 맥파 데이터
 *             analysis:
 *               type: object
 *               description: 맥파 분석 결과
 *         status:
 *           type: string
 *           enum: [active, inactive, archived]
 *           default: active
 *           description: 환자 상태
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 등록일시
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 수정일시
 */

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: 환자 목록 조회
 *     description: 등록된 환자 목록을 페이지네이션과 검색 기능과 함께 조회합니다.
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/searchParam'
 *       - in: query
 *         name: visitType
 *         schema:
 *           type: string
 *           enum: [초진, 재진]
 *         description: 방문 유형으로 필터링
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, archived]
 *         description: 환자 상태로 필터링
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
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Patient'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: 전체 환자 수
 *                     page:
 *                       type: integer
 *                       description: 현재 페이지
 *                     limit:
 *                       type: integer
 *                       description: 페이지당 항목 수
 *                     pages:
 *                       type: integer
 *                       description: 전체 페이지 수
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *   post:
 *     summary: 환자 등록
 *     description: 새로운 환자를 시스템에 등록합니다.
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - basicInfo
 *             properties:
 *               basicInfo:
 *                 type: object
 *                 required:
 *                   - name
 *                   - gender
 *                   - phone
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: 환자 이름
 *                   gender:
 *                     type: string
 *                     enum: [male, female]
 *                     description: 성별
 *                   birthDate:
 *                     type: string
 *                     format: date
 *                     description: 생년월일
 *                   phone:
 *                     type: string
 *                     description: 연락처
 *                   residentNumber:
 *                     type: string
 *                     description: 주민등록번호
 *                   personality:
 *                     type: string
 *                     description: 성격
 *                   workIntensity:
 *                     type: string
 *                     description: 업무 강도
 *                   height:
 *                     type: number
 *                     description: 키 (cm)
 *                   weight:
 *                     type: number
 *                     description: 체중 (kg)
 *                   visitType:
 *                     type: string
 *                     enum: [초진, 재진]
 *                     default: 초진
 *                     description: 방문 유형
 *               medicalInfo:
 *                 type: object
 *                 properties:
 *                   allergies:
 *                     type: array
 *                     items:
 *                       type: string
 *                   medications:
 *                     type: array
 *                     items:
 *                       type: string
 *                   medicalHistory:
 *                     type: array
 *                     items:
 *                       type: string
 *               stress:
 *                 type: object
 *                 properties:
 *                   level:
 *                     type: string
 *                     enum: [low, medium, high]
 *                   score:
 *                     type: number
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                   details:
 *                     type: string
 *               pulseWave:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: array
 *                     items:
 *                       type: number
 *                   analysis:
 *                     type: object
 *     responses:
 *       201:
 *         description: 환자 등록 성공
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
 *                   example: 환자가 성공적으로 등록되었습니다.
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       409:
 *         description: 중복된 환자 정보
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: 환자 상세 정보 조회
 *     description: 특정 환자의 상세 정보를 조회합니다.
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
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       404:
 *         description: 환자를 찾을 수 없음
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *   put:
 *     summary: 환자 정보 수정
 *     description: 환자 정보를 수정합니다.
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
 *                   example: 환자 정보가 성공적으로 수정되었습니다.
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       404:
 *         description: 환자를 찾을 수 없음
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: 환자 삭제
 *     description: 환자 정보를 삭제합니다. (실제 삭제가 아닌 비활성화)
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
 *     responses:
 *       200:
 *         description: 환자 삭제 성공
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
 *                   example: 환자가 성공적으로 삭제되었습니다.
 *       404:
 *         description: 환자를 찾을 수 없음
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/patients/search:
 *   get:
 *     summary: 환자 검색
 *     description: 환자명, 전화번호, 주민등록번호로 환자를 검색합니다.
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색어 (환자명, 전화번호, 주민등록번호)
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: 검색 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
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
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */

/**
 * @swagger
 * components:
 *   parameters:
 *     pageParam:
 *       in: query
 *       name: page
 *       schema:
 *         type: integer
 *         default: 1
 *         minimum: 1
 *       description: 페이지 번호
 *     limitParam:
 *       in: query
 *       name: limit
 *       schema:
 *         type: integer
 *         default: 10
 *         minimum: 1
 *         maximum: 100
 *       description: 페이지당 항목 수
 *     searchParam:
 *       in: query
 *       name: search
 *       schema:
 *         type: string
 *         description: 검색어 (이름, 연락처)
 *     idParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: 환자 ID
 *   schemas:
 *     Error:
 *       type: object
 *       required:
 *         - success
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: 오류 메시지
 *         error:
 *           type: string
 *           example: 오류 상세
 */

// 박종화 환자 데이터 디버깅용 API (동적 라우트보다 먼저 배치)
router.get('/debug/park-jonghwa', async (req, res) => {
  try {
    console.log('🔍 박종화 환자 데이터 디버깅 시작');
    
    // Patient 모델에서 박종화 환자 찾기
    const patientFromPatient = await Patient.findOne({
      'basicInfo.name': '박종화'
    }).lean();
    
    console.log('📊 Patient 모델에서 찾은 박종화:', patientFromPatient ? {
      _id: patientFromPatient._id,
      patientId: patientFromPatient.patientId,
      name: patientFromPatient.basicInfo?.name,
      stress: patientFromPatient.stress,
      records: patientFromPatient.records,
      medication: patientFromPatient.medication
    } : '찾을 수 없음');
    
    // PatientData 모델에서도 찾기
    const patientFromPatientData = await PatientData.findOne({
      'basicInfo.name': '박종화'
    }).lean();
    
    console.log('📊 PatientData 모델에서 찾은 박종화:', patientFromPatientData ? {
      _id: patientFromPatientData._id,
      patientId: patientFromPatientData.basicInfo?.patientId,
      name: patientFromPatientData.basicInfo?.name,
      stress: patientFromPatientData.lifestyle?.stress,
      medication: patientFromPatientData.medication
    } : '찾을 수 없음');
    
    // Queue에서 박종화 환자 찾기
    const queueFromPatient = await Queue.findOne({
      'patientId.basicInfo.name': '박종화'
    }).populate('patientId').lean();
    
    console.log('📊 Queue에서 찾은 박종화:', queueFromPatient ? {
      _id: queueFromPatient._id,
      status: queueFromPatient.status,
      patientName: queueFromPatient.patientId?.basicInfo?.name,
      patientStress: queueFromPatient.patientId?.stress,
      patientRecords: queueFromPatient.patientId?.records
    } : '찾을 수 없음');
    
    res.json({
      success: true,
      debug: {
        patientFromPatient,
        patientFromPatientData,
        queueFromPatient
      }
    });
    
  } catch (error) {
    console.error('❌ 박종화 환자 디버깅 오류:', error);
    res.status(500).json({
      success: false,
      message: '디버깅 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 기존 라우트들
router.get('/', authenticate, patientController.getPatients);
router.post('/', authenticate, validatePatient, patientController.createPatient);
router.get('/:id', authenticate, patientController.getPatientById);
router.put('/:id', authenticate, validatePatient, patientController.updatePatient);
router.delete('/:id', authenticate, patientController.deletePatient);
router.get('/search', authenticate, patientController.searchPatients);

module.exports = router;