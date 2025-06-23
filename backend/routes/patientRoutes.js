const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const auth = require('../middlewares/auth');
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

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: 환자 관리 API
 */

// 유비오맥파기 실행 API
router.post('/execute-ubio', async (req, res) => {
  const ubioPath = 'C:\\Program Files (x86)\\uBioMacpa Pro\\bin\\uBioMacpaPro.exe';
  const ubioDir = path.dirname(ubioPath);
  const ubioExe = path.basename(ubioPath);

  try {
    logger.info('🔬 유비오맥파기 실행 시도:', ubioPath);

    if (!fs.existsSync(ubioPath)) {
      logger.error('❌ 유비오맥파기 실행 파일을 찾을 수 없습니다:', ubioPath);
      return res.status(404).json({
        success: false,
        message: '유비오맥파기 프로그램을 찾을 수 없습니다. 설치 경로를 확인해주세요.'
      });
    }

    const { stdout, stderr } = await execPromise(`"${ubioExe}"`, { cwd: ubioDir });

    if (stderr) {
      logger.warn('⚠️ 유비오맥파기 실행 중 경고 또는 오류 발생:', stderr);
      // 오류 메시지에 '저장위치'가 포함된 경우, 특정 안내 메시지 전송
      if (stderr.includes('저장위치')) {
        return res.status(500).json({
          success: false,
          message: '프로그램이 실행되었으나 저장 위치를 찾지 못했습니다. 프로그램 설정에서 저장 경로를 확인해주세요.',
          error: stderr
        });
      }
    }
    
    logger.info('✅ 유비오맥파기 실행 성공');
    res.json({
      success: true,
      message: '유비오맥파기가 성공적으로 실행되었습니다.',
      stdout: stdout
    });

  } catch (error) {
    logger.error('❌ 유비오맥파기 실행 API 오류:', error);
    res.status(500).json({
      success: false,
      message: '유비오맥파기 실행 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 유비오맥파 측정 결과 자동 가져오기 API
router.post('/read-ubio-result', async (req, res) => {
  const { patientName } = req.body;
  if (!patientName) {
    return res.status(400).json({ success: false, message: '환자 이름이 필요합니다.' });
  }

  const filePath = 'D:\\uBioMacpaData\\유비오측정맥파.xlsx';
  logger.info(`🔬 유비오맥파 결과 파일 읽기 시도: ${filePath}`);

  try {
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      logger.error('❌ 유비오맥파 결과 파일을 찾을 수 없습니다:', filePath);
      return res.status(404).json({
        success: false,
        message: '측정 결과 파일을 찾을 수 없습니다. 저장 경로를 확인해주세요. (D:\\uBioMacpaData\\유비오측정맥파.xlsx)'
      });
    }

    const xlsx = require('xlsx');
    const workbook = xlsx.readFile(filePath, {cellDates: true});
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    logger.info(`📑 엑셀 파일 로드 완료. 총 ${rows.length}개 행`);

    let rowData = null;
    for (let i = rows.length - 1; i >= 0; i--) {
      const excelRowName = rows[i][0];
      if (excelRowName && typeof excelRowName === 'string' && excelRowName.trim() === patientName.trim()) {
        rowData = rows[i];
        logger.info(`✅ '${patientName}' 환자 데이터 발견 (엑셀 ${i + 1}번째 행)`);
        break;
      }
    }

    if (!rowData) {
      logger.warn(`⚠️ 엑셀 파일에서 '${patientName}' 환자 데이터를 찾을 수 없습니다.`);
      return res.status(404).json({
        success: false,
        message: `엑셀 파일에서 '${patientName}' 환자의 데이터를 찾을 수 없습니다.`
      });
    }

    if (rowData.length < 17) {
      logger.error(`❌ 데이터 형식 오류: ${patientName} 환자의 데이터 길이가 너무 짧습니다. (${rowData.length}개)`);
      return res.status(400).json({
        success: false,
        message: '선택된 환자의 데이터 형식이 올바르지 않습니다.'
      });
    }

    const ELASTICITY_SCORES = { 'A': 0.2, 'B': 0.4, 'C': 0.6, 'D': 0.8, 'E': 1.0 };

    const pulseData = {
      'elasticityScore': ELASTICITY_SCORES[rowData[8]] || null,
      'a-b': rowData[9] !== undefined ? parseFloat(rowData[9]) : null,
      'a-c': rowData[10] !== undefined ? parseFloat(rowData[10]) : null,
      'a-d': rowData[11] !== undefined ? parseFloat(rowData[11]) : null,
      'a-e': rowData[12] !== undefined ? parseFloat(rowData[12]) : null,
      'b/a': rowData[13] !== undefined ? parseFloat(rowData[13]) : null,
      'c/a': rowData[14] !== undefined ? parseFloat(rowData[14]) : null,
      'd/a': rowData[15] !== undefined ? parseFloat(rowData[15]) : null,
      'e/a': rowData[16] !== undefined ? parseFloat(rowData[16]) : null,
    };

    res.json({ success: true, pulseData });

  } catch (error) {
    logger.error('❌ 유비오맥파 결과 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: '결과 파일 처리 중 서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 임시 환자 데이터 엔드포인트 (동적 라우트보다 먼저 배치)
router.get('/data', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', visitType = '', status = '' } = req.query;
    
    console.log('🔍 검색 요청:', { search, page, limit, visitType, status });
    
    const searchConditions = {};
    
    if (search) {
      searchConditions.$or = [
        { 'basicInfo.name': { $regex: search, $options: 'i' } },
        { 'basicInfo.patientId': { $regex: search, $options: 'i' } },
        { 'basicInfo.phone': { $regex: search, $options: 'i' } },
        { 'basicInfo.residentNumber': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (visitType) {
      searchConditions['basicInfo.visitType'] = visitType;
    }
    
    if (status) {
      searchConditions.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 먼저 Patient 모델에서 검색 시도
    console.log('🔍 Patient 모델에서 검색 시도...');
    let patientsFromPatient = await Patient.find(searchConditions)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    console.log(`📊 Patient 모델 검색 결과: ${patientsFromPatient.length}개`);

    // PatientData 모델에서도 검색
    console.log('🔍 PatientData 모델에서 검색 시도...');
    let patientsFromPatientData = await PatientData.find(searchConditions)
      .sort({ 'basicInfo.lastVisitDate': -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    console.log(`📊 PatientData 모델 검색 결과: ${patientsFromPatientData.length}개`);

    // 결과 병합 및 중복 제거
    let allPatients = [];
    
    // Patient 모델 결과를 PatientData 형식으로 변환
    const patientResults = patientsFromPatient.map(patient => ({
      _id: patient._id,
      basicInfo: {
        patientId: patient.patientId,
        name: patient.basicInfo.name,
        phone: patient.basicInfo.phone,
        gender: patient.basicInfo.gender,
        residentNumber: patient.basicInfo.residentNumber,
        birthDate: patient.basicInfo.birthDate,
        visitType: patient.basicInfo.visitType,
        personality: patient.basicInfo.personality,
        workIntensity: patient.basicInfo.workIntensity,
        height: patient.basicInfo.height,
        weight: patient.basicInfo.weight,
        bmi: patient.basicInfo.bmi,
        lastVisitDate: patient.updatedAt,
        firstVisitDate: patient.createdAt,
        visitCount: patient.records ? patient.records.length : 1
      },
      status: patient.status,
      medication: patient.medication,
      pulseWaveInfo: patient.records && patient.records.length > 0 ? {
        symptoms: patient.records[patient.records.length - 1].symptoms,
        memo: patient.records[patient.records.length - 1].memo,
        stress: patient.records[patient.records.length - 1].stress,
        pulseAnalysis: patient.records[patient.records.length - 1].pulseAnalysis
      } : null
    }));

    // PatientData 결과 추가
    allPatients = [...patientResults, ...patientsFromPatientData];

    // 중복 제거 (patientId 기준)
    const uniquePatients = allPatients.filter((patient, index, self) => 
      index === self.findIndex(p => p.basicInfo?.patientId === patient.basicInfo?.patientId)
    );

    console.log(`📊 최종 결과: ${uniquePatients.length}개 (중복 제거 후)`);

    // 나이 계산
    const patientsWithAge = uniquePatients.map(patient => {
      if (patient.basicInfo?.birthDate) {
        const birthDate = new Date(patient.basicInfo.birthDate);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          return { ...patient, age: age - 1 };
        }
        return { ...patient, age };
      }
      return patient;
    });

    // 전체 레코드 수 계산 (두 모델 모두에서)
    const totalFromPatient = await Patient.countDocuments(searchConditions);
    const totalFromPatientData = await PatientData.countDocuments(searchConditions);
    const totalRecords = Math.max(totalFromPatient, totalFromPatientData);

    res.json({
      success: true,
      patients: patientsWithAge,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / parseInt(limit)),
        totalRecords,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('환자 데이터 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '환자 데이터 조회 중 오류가 발생했습니다.'
    });
  }
});

// 환자 상세 정보 조회 엔드포인트
router.get('/data/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    logger.info(`[DEBUG] /data/:patientId 라우트 진입. 요청된 patientId: ${patientId}`);

    // Patient와 PatientData 모델에서 동시에 검색
    const [patient, patientData] = await Promise.all([
      Patient.findOne({ patientId: patientId }).lean(),
      PatientData.findOne({ 'basicInfo.patientId': patientId }).lean()
    ]);
    
    logger.info(`[DEBUG] Patient 모델 조회 결과: ${patient ? '데이터 있음' : '데이터 없음'}`);
    logger.info(`[DEBUG] PatientData 모델 조회 결과: ${patientData ? '데이터 있음' : '데이터 없음'}`);

    if (!patient && !patientData) {
      logger.warn(`[DEBUG] 두 모델 모두에서 환자 없음: ${patientId}`);
      return res.status(404).json({
        success: false,
        message: '해당 환자를 찾을 수 없습니다.'
      });
    }

    // 두 모델의 정보를 병합
    // patientData를 기본으로 하고, patient 정보로 덮어쓰거나 추가
    const combinedData = { ...(patientData || {}), ...(patient || {}) };

    // 나이 계산 (birthDate가 basicInfo 안에 있을 수 있으므로)
    if (combinedData.basicInfo?.birthDate) {
      const birthDate = new Date(combinedData.basicInfo.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      combinedData.age = age;
    }

    // 최신 맥파 정보 추가 (patient 모델의 records 사용)
    if (patient?.records && patient.records.length > 0) {
      const latestRecord = patient.records[patient.records.length - 1];
      combinedData.pulseWaveInfo = {
        date: latestRecord.date,
        pulseWave: latestRecord.pulseWave,
        pulseAnalysis: latestRecord.pulseAnalysis,
        macSang: latestRecord.macSang,
        symptoms: latestRecord.symptoms,
        memo: latestRecord.memo,
        stress: latestRecord.stress
      };
    }

    logger.info(`[DEBUG] 최종 병합된 데이터 전송. 환자 ID: ${patientId}`);
    res.json({
      success: true,
      patientData: combinedData
    });

  } catch (error) {
    logger.error(`❌ 환자 상세 정보 조회 실패: ${req.params.patientId}`, error);
    res.status(500).json({
      success: false,
      message: '환자 상세 정보 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

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