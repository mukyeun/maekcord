const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate } = require('../middlewares/auth');
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
 * /api/patients/data:
 *   get:
 *     summary: 환자 상세 정보 조회
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
      .lean() || [];

    console.log(`📊 Patient 모델 검색 결과: ${patientsFromPatient.length}개`);

    // PatientData 모델에서도 검색
    console.log('🔍 PatientData 모델에서 검색 시도...');
    let patientsFromPatientData = await PatientData.find(searchConditions)
      .sort({ 'basicInfo.lastVisitDate': -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean() || [];

    console.log(`📊 PatientData 모델 검색 결과: ${patientsFromPatientData.length}개`);

    // 결과 병합 및 중복 제거
    let allPatients = [];
    
    // Patient 모델 결과를 PatientData 형식으로 변환
    const patientResults = patientsFromPatient.map(patient => {
      let latestRecord = Array.isArray(patient.records) && patient.records.length > 0
        ? patient.records[patient.records.length - 1]
        : {};

      return {
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
        pulseWaveInfo: latestRecord
          ? {
              symptoms: latestRecord.symptoms,
              memo: latestRecord.memo,
              stress: latestRecord.stress,
              pulseAnalysis: latestRecord.pulseAnalysis,
              pulseWave: latestRecord.pulseWave
            }
          : null
      };
    });

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

// ✅ 환자 상세 정보 조회 API (PatientDataTable에서 사용)
router.get('/data/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    logger.info(`📋 환자 상세 정보 조회 요청: ${patientId}`);

    // ObjectId 형식인지 확인
    const isObjectId = mongoose.Types.ObjectId.isValid(patientId);
    
    let patientData = null;

    if (isObjectId) {
      // ObjectId인 경우 _id로도 검색
      patientData = await Patient.findOne({
        $or: [
          { _id: patientId },
          { 'basicInfo.patientId': patientId }
        ]
      }).lean();

      if (!patientData) {
        patientData = await PatientData.findOne({
          $or: [
            { _id: patientId },
            { 'basicInfo.patientId': patientId }
          ]
        }).lean();
      }
    } else {
      // ObjectId가 아닌 경우 patientId 필드로만 검색
      patientData = await Patient.findOne({
        'basicInfo.patientId': patientId
      }).lean();

      if (!patientData) {
        patientData = await PatientData.findOne({
          'basicInfo.patientId': patientId
        }).lean();
      }
    }

    if (!patientData) {
      logger.warn(`⚠️ 환자를 찾을 수 없음: ${patientId}`);
      return res.status(404).json({
        success: false,
        message: '해당 환자를 찾을 수 없습니다.'
      });
    }

    // 나이 계산
    if (patientData.basicInfo?.birthDate) {
      const birthDate = new Date(patientData.basicInfo.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        patientData.age = age - 1;
      } else {
        patientData.age = age;
      }
    }

    logger.info(`✅ 환자 상세 정보 조회 성공: ${patientData.basicInfo?.name || patientData.name}`);

    res.json({
      success: true,
      patientData,
      message: '환자 상세 정보 조회 성공'
    });

  } catch (error) {
    logger.error('❌ 환자 상세 정보 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '환자 상세 정보 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

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

// ✅ 유비오맥파 측정 결과 읽기 API
router.post('/read-ubio-result', async (req, res) => {
  try {
    const { patientName } = req.body;
    
    if (!patientName) {
      return res.status(400).json({
        success: false,
        message: '환자 이름이 필요합니다.'
      });
    }

    logger.info(`📊 '${patientName}' 환자의 유비오맥파 측정 결과 읽기 시도`);

    // 유비오맥파 엑셀 파일 경로
    const excelPath = 'D:\\uBioMacpaData\\유비오측정맥파.xlsx';

    // 파일 존재 여부 확인
    if (!fs.existsSync(excelPath)) {
      logger.error('❌ 유비오맥파 결과 파일을 찾을 수 없습니다');
      return res.status(404).json({
        success: false,
        message: '측정 결과 파일을 찾을 수 없습니다. 먼저 측정을 진행해주세요.'
      });
    }

    // Excel 파일 읽기
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // 환자 데이터 찾기
    const patientData = data.filter(row => 
      row[0] && typeof row[0] === 'string' && row[0].trim() === patientName.trim()
    );

    if (patientData.length === 0) {
      logger.warn(`⚠️ '${patientName}' 환자의 데이터를 찾을 수 없습니다.`);
      return res.status(404).json({
        success: false,
        message: `'${patientName}' 환자의 측정 데이터를 찾을 수 없습니다. 먼저 측정을 진행해주세요.`
      });
    }

    // 가장 최근 데이터 사용
    const latestData = patientData[patientData.length - 1];

    if (latestData.length < 17) {
      logger.error(`❌ 데이터 형식 오류: 데이터 길이가 너무 짧습니다. (${latestData.length}개)`);
      return res.status(400).json({
        success: false,
        message: '선택된 환자의 데이터 형식이 올바르지 않습니다.'
      });
    }

    const ELASTICITY_SCORES = { 'A': 0.2, 'B': 0.4, 'C': 0.6, 'D': 0.8, 'E': 1.0 };
    const pulseData = {
      'elasticityScore': ELASTICITY_SCORES[latestData[8]] || null,
      'a-b': latestData[9] !== undefined ? parseFloat(latestData[9]) : null,
      'a-c': latestData[10] !== undefined ? parseFloat(latestData[10]) : null,
      'a-d': latestData[11] !== undefined ? parseFloat(latestData[11]) : null,
      'a-e': latestData[12] !== undefined ? parseFloat(latestData[12]) : null,
      'b/a': latestData[13] !== undefined ? parseFloat(latestData[13]) : null,
      'c/a': latestData[14] !== undefined ? parseFloat(latestData[14]) : null,
      'd/a': latestData[15] !== undefined ? parseFloat(latestData[15]) : null,
      'e/a': latestData[16] !== undefined ? parseFloat(latestData[16]) : null,
      lastUpdated: new Date().toISOString()
    };

    logger.info(`✅ '${patientName}' 환자의 맥파 데이터 추출 성공`);

    return res.json({ 
      success: true, 
      pulseData,
      fileInfo: {
        path: excelPath,
        lastModified: fs.statSync(excelPath).mtime
      }
    });

  } catch (error) {
    logger.error('❌ 유비오맥파 결과 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: '결과 파일 처리 중 서버 오류가 발생했습니다.',
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
    console.log('✅ req.body.records:', req.body.records);
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
router.put('/:id', patientController.updatePatient);

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
router.put('/:id/status', patientController.updateStatus);

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

// ✅ 환자 일괄 삭제 API
router.post('/delete-multiple', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '삭제할 환자 ID 목록이 필요합니다.'
      });
    }

    logger.info(`🗑️ 환자 일괄 삭제 요청: ${ids.length}개 환자`);

    // 환자 데이터 삭제 (PatientData 컬렉션)
    const patientDataResult = await PatientData.deleteMany({
      _id: { $in: ids }
    });

    // 환자 기본 정보 삭제 (Patient 컬렉션)
    const patientResult = await Patient.deleteMany({
      _id: { $in: ids }
    });

    logger.info(`✅ 환자 일괄 삭제 완료: ${patientResult.deletedCount}개 환자 삭제됨`);

    res.json({
      success: true,
      message: `${patientResult.deletedCount}명의 환자가 성공적으로 삭제되었습니다.`,
      deletedCount: patientResult.deletedCount
    });

  } catch (error) {
    logger.error('❌ 환자 일괄 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '환자 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;