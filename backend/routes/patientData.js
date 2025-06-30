const express = require('express');
const router = express.Router();
const PatientData = require('../models/PatientData');
const Counter = require('../models/Counter');
const moment = require('moment-timezone');

// 환자 데이터 생성
router.post('/', async (req, res) => {
  try {
    const {
      basicInfo,
      symptoms,
      medication,
      lifestyle,
      familyHistory,
      medicalHistory,
      generalMemo,
      createdBy
    } = req.body;

    // 환자 ID 생성
    const patientId = await PatientData.generateUniqueId();
    
    // 기본 정보에 환자 ID 추가
    const patientBasicInfo = {
      ...basicInfo,
      patientId
    };

    // 새로운 환자 데이터 생성
    const newPatientData = new PatientData({
      basicInfo: patientBasicInfo,
      symptoms: symptoms || {},
      medication: medication || {},
      lifestyle: lifestyle || {},
      familyHistory: familyHistory || {},
      medicalHistory: medicalHistory || {},
      generalMemo: generalMemo || '',
      metadata: {
        createdBy,
        lastUpdatedBy: createdBy,
        dataQuality: 'good',
        lastDataUpdate: new Date()
      }
    });

    // 활동 로그 추가
    newPatientData.addActivityLog('created', '환자 데이터가 생성되었습니다.', createdBy);

    await newPatientData.save();

    res.status(201).json({
      success: true,
      message: '환자 데이터가 성공적으로 생성되었습니다.',
      patientData: newPatientData
    });

  } catch (error) {
    console.error('환자 데이터 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '환자 데이터 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 환자 데이터 목록 조회
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', visitType = '', status = '' } = req.query;
    
    // 검색 조건 구성
    const searchConditions = {};
    
    if (search) {
      searchConditions.$or = [
        { 'basicInfo.name': { $regex: search, $options: 'i' } },
        { 'basicInfo.patientId': { $regex: search, $options: 'i' } },
        { 'basicInfo.phone': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (visitType) {
      searchConditions['basicInfo.visitType'] = visitType;
    }
    
    if (status) {
      searchConditions.status = status;
    }

    // 페이지네이션 계산
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 데이터 조회
    const patients = await PatientData.find(searchConditions)
      .sort({ 'basicInfo.lastVisitDate': -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // 전체 레코드 수 조회
    const totalRecords = await PatientData.countDocuments(searchConditions);

    // 나이 계산 추가
    const patientsWithAge = patients.map(patient => {
      if (patient.basicInfo.birthDate) {
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

// 환자 상세 정보 조회
router.get('/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patientData = await PatientData.findOne({
      'basicInfo.patientId': patientId
    }).lean();

    if (!patientData) {
      return res.status(404).json({
        success: false,
        message: '환자를 찾을 수 없습니다.'
      });
    }

    // 나이 계산
    if (patientData.basicInfo.birthDate) {
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

    res.json({
      success: true,
      patientData
    });
  } catch (error) {
    console.error('환자 상세 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '환자 상세 정보 조회 중 오류가 발생했습니다.'
    });
  }
});

// 환자 데이터 수정
router.put('/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const updateData = req.body;
    const { updatedBy } = req.body;

    const patientData = await PatientData.findOne({ 'basicInfo.patientId': patientId });

    if (!patientData) {
      return res.status(404).json({
        success: false,
        message: '해당 환자 데이터를 찾을 수 없습니다.'
      });
    }

    // 업데이트할 필드들
    const fieldsToUpdate = [
      'basicInfo', 'symptoms', 'medication', 'lifestyle', 
      'familyHistory', 'medicalHistory', 'generalMemo', 'status'
    ];

    fieldsToUpdate.forEach(field => {
      if (updateData[field]) {
        patientData[field] = updateData[field];
      }
    });

    // 메타데이터 업데이트
    patientData.metadata.lastUpdatedBy = updatedBy;
    patientData.metadata.lastDataUpdate = new Date();

    // 활동 로그 추가
    patientData.addActivityLog('updated', '환자 데이터가 수정되었습니다.', updatedBy);

    await patientData.save();

    res.json({
      success: true,
      message: '환자 데이터가 성공적으로 수정되었습니다.',
      patientData
    });

  } catch (error) {
    console.error('환자 데이터 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '환자 데이터 수정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 진료 기록 추가
router.post('/:patientId/medical-records', async (req, res) => {
  try {
    const { patientId } = req.params;
    const {
      doctorId,
      subjectiveSymptoms,
      objectiveFindings,
      pulseAnalysis,
      pulseWave,
      macSang,
      diagnosis,
      treatment,
      prognosis,
      memo
    } = req.body;

    const patientData = await PatientData.findOne({ 'basicInfo.patientId': patientId });

    if (!patientData) {
      return res.status(404).json({
        success: false,
        message: '해당 환자 데이터를 찾을 수 없습니다.'
      });
    }

    // 진료 기록 ID 생성
    const counter = await Counter.findOneAndUpdate(
      { name: 'medicalRecord' },
      { $inc: { sequence: 1 } },
      { upsert: true, new: true }
    );

    const recordId = `MR${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${counter.sequence.toString().padStart(4, '0')}`;

    // 새로운 진료 기록 생성
    const newMedicalRecord = {
      recordId,
      visitDate: new Date(),
      doctorId,
      subjectiveSymptoms: subjectiveSymptoms || [],
      objectiveFindings: objectiveFindings || [],
      pulseAnalysis: pulseAnalysis || {},
      pulseWave: pulseWave || {},
      macSang: macSang || {},
      diagnosis: diagnosis || {},
      treatment: treatment || {},
      prognosis: prognosis || '보통',
      memo: memo || '',
      status: 'completed'
    };

    patientData.medicalRecords.push(newMedicalRecord);

    // 방문 정보 업데이트
    patientData.basicInfo.lastVisitDate = new Date();
    patientData.basicInfo.visitCount += 1;

    // 활동 로그 추가
    patientData.addActivityLog('medical_record_added', `진료 기록이 추가되었습니다. (${recordId})`, doctorId);

    await patientData.save();

    res.status(201).json({
      success: true,
      message: '진료 기록이 성공적으로 추가되었습니다.',
      medicalRecord: newMedicalRecord
    });

  } catch (error) {
    console.error('진료 기록 추가 오류:', error);
    res.status(500).json({
      success: false,
      message: '진료 기록 추가 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 진료 기록 수정
router.put('/:patientId/medical-records/:recordId', async (req, res) => {
  try {
    const { patientId, recordId } = req.params;
    const updateData = req.body;
    const { updatedBy } = req.body;

    const patientData = await PatientData.findOne({ 'basicInfo.patientId': patientId });

    if (!patientData) {
      return res.status(404).json({
        success: false,
        message: '해당 환자 데이터를 찾을 수 없습니다.'
      });
    }

    const medicalRecord = patientData.medicalRecords.find(record => record.recordId === recordId);

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: '해당 진료 기록을 찾을 수 없습니다.'
      });
    }

    // 진료 기록 업데이트
    Object.assign(medicalRecord, updateData);

    // 활동 로그 추가
    patientData.addActivityLog('medical_record_updated', `진료 기록이 수정되었습니다. (${recordId})`, updatedBy);

    await patientData.save();

    res.json({
      success: true,
      message: '진료 기록이 성공적으로 수정되었습니다.',
      medicalRecord
    });

  } catch (error) {
    console.error('진료 기록 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '진료 기록 수정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 환자 데이터 삭제 (소프트 삭제)
router.delete('/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { deletedBy } = req.body;

    const patientData = await PatientData.findOne({ 'basicInfo.patientId': patientId });

    if (!patientData) {
      return res.status(404).json({
        success: false,
        message: '해당 환자 데이터를 찾을 수 없습니다.'
      });
    }

    patientData.status = 'inactive';
    patientData.addActivityLog('deleted', '환자 데이터가 삭제되었습니다.', deletedBy);

    await patientData.save();

    res.json({
      success: true,
      message: '환자 데이터가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('환자 데이터 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '환자 데이터 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 환자 데이터 통계
router.get('/statistics/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    
    if (startDate && endDate) {
      query['basicInfo.firstVisitDate'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // 전체 환자 수
    const totalPatients = await PatientData.countDocuments(query);
    
    // 활성 환자 수
    const activePatients = await PatientData.countDocuments({ ...query, status: 'active' });
    
    // 초진/재진 통계
    const visitTypeStats = await PatientData.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$basicInfo.visitType',
          count: { $sum: 1 }
        }
      }
    ]);

    // 성별 통계
    const genderStats = await PatientData.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$basicInfo.gender',
          count: { $sum: 1 }
        }
      }
    ]);

    // 연령대별 통계
    const ageStats = await PatientData.aggregate([
      { $match: query },
      {
        $addFields: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$basicInfo.birthDate'] },
                365 * 24 * 60 * 60 * 1000
              ]
            }
          }
        }
      },
      {
        $bucket: {
          groupBy: '$age',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: '100+',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // 월별 신규 환자 통계 (최근 12개월)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyStats = await PatientData.aggregate([
      {
        $match: {
          ...query,
          'basicInfo.firstVisitDate': { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$basicInfo.firstVisitDate' },
            month: { $month: '$basicInfo.firstVisitDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      statistics: {
        totalPatients,
        activePatients,
        visitTypeStats,
        genderStats,
        ageStats,
        monthlyStats
      }
    });

  } catch (error) {
    console.error('환자 데이터 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '환자 데이터 통계 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 환자 데이터 검색 (고급 검색)
router.post('/search', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      searchCriteria,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.body;

    const query = {};

    // 검색 조건 구성
    if (searchCriteria) {
      if (searchCriteria.name) {
        query['basicInfo.name'] = { $regex: searchCriteria.name, $options: 'i' };
      }
      
      if (searchCriteria.patientId) {
        query['basicInfo.patientId'] = { $regex: searchCriteria.patientId, $options: 'i' };
      }
      
      if (searchCriteria.phone) {
        query['basicInfo.phone'] = { $regex: searchCriteria.phone, $options: 'i' };
      }
      
      if (searchCriteria.visitType) {
        query['basicInfo.visitType'] = searchCriteria.visitType;
      }
      
      if (searchCriteria.status) {
        query.status = searchCriteria.status;
      }
      
      if (searchCriteria.symptoms) {
        query['symptoms.mainSymptoms.symptom'] = { $regex: searchCriteria.symptoms, $options: 'i' };
      }
      
      if (searchCriteria.medications) {
        query['medication.currentMedications.name'] = { $regex: searchCriteria.medications, $options: 'i' };
      }
      
      if (searchCriteria.startDate && searchCriteria.endDate) {
        query['basicInfo.firstVisitDate'] = {
          $gte: new Date(searchCriteria.startDate),
          $lte: new Date(searchCriteria.endDate)
        };
      }
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const patients = await PatientData.find(query)
      .populate('metadata.createdBy', 'name role')
      .populate('metadata.lastUpdatedBy', 'name role')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PatientData.countDocuments(query);

    res.json({
      success: true,
      patients,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        recordsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('환자 데이터 검색 오류:', error);
    res.status(500).json({
      success: false,
      message: '환자 데이터 검색 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 진료 기록 분석 조회
router.get('/:patientId/medical-history', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { period = '6months', type = 'all' } = req.query;

    const patientData = await PatientData.findOne({ 'basicInfo.patientId': patientId });

    if (!patientData) {
      return res.status(404).json({
        success: false,
        message: '해당 환자 데이터를 찾을 수 없습니다.'
      });
    }

    let filteredRecords = patientData.medicalRecords || [];

    // 기간 필터링
    if (period !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case '3months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case '6months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case '1year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          startDate = new Date(0); // 모든 기록
      }
      
      filteredRecords = filteredRecords.filter(record => 
        new Date(record.visitDate) >= startDate
      );
    }

    // 방문 유형 필터링
    if (type !== 'all') {
      filteredRecords = filteredRecords.filter(record => 
        record.visitType === type
      );
    }

    // 날짜순 정렬 (최신순)
    filteredRecords.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

    // 방문 빈도 분석
    const visitFrequency = calculateVisitFrequency(filteredRecords);
    
    // 맥파 추이 분석
    const pulseTrends = analyzePulseTrends(filteredRecords);
    
    // 증상 변화 분석
    const symptomChanges = analyzeSymptomChanges(filteredRecords);

    res.json({
      success: true,
      records: filteredRecords,
      analysis: {
        visitFrequency,
        pulseTrends,
        symptomChanges,
        totalRecords: filteredRecords.length,
        period,
        type
      }
    });

  } catch (error) {
    console.error('진료 기록 분석 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '진료 기록 분석 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 방문 빈도 계산 함수
const calculateVisitFrequency = (records) => {
  if (records.length < 2) {
    return {
      frequency: 0,
      trend: 'stable',
      analysis: {
        level: 'normal',
        message: '진료 기록이 충분하지 않습니다.',
        recommendation: '더 많은 진료 기록이 필요합니다.'
      }
    };
  }

  const sortedRecords = records.sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
  const firstVisit = new Date(sortedRecords[0].visitDate);
  const lastVisit = new Date(sortedRecords[sortedRecords.length - 1].visitDate);
  const monthsDiff = Math.max(1, (lastVisit.getFullYear() - firstVisit.getFullYear()) * 12 + 
    (lastVisit.getMonth() - firstVisit.getMonth()));
  
  const frequency = records.length / monthsDiff;
  
  // 최근 3개월과 이전 3개월 비교
  const recentRecords = sortedRecords.slice(-3);
  const previousRecords = sortedRecords.slice(-6, -3);
  const recentFreq = recentRecords.length / 3;
  const previousFreq = previousRecords.length / 3;
  
  let trend = 'stable';
  if (recentFreq > previousFreq * 1.2) trend = 'increasing';
  else if (recentFreq < previousFreq * 0.8) trend = 'decreasing';
  
  let analysis = {
    level: 'normal',
    message: '정상적인 방문 빈도입니다.',
    recommendation: '현재 치료 계획을 유지하세요.'
  };
  
  if (frequency > 3) {
    analysis = {
      level: 'high',
      message: '높은 방문 빈도입니다.',
      recommendation: '치료 효과를 재검토하고 근본 원인을 파악해보세요.'
    };
  } else if (frequency < 0.5) {
    analysis = {
      level: 'low',
      message: '낮은 방문 빈도입니다.',
      recommendation: '정기적인 관리가 필요할 수 있습니다.'
    };
  }
  
  return { frequency, trend, analysis };
};

// 맥파 추이 분석 함수
const analyzePulseTrends = (records) => {
  const recordsWithPulse = records.filter(r => r.pulseWave && 
    (r.pulseWave.systolicBP || r.pulseWave.diastolicBP || r.pulseWave.heartRate));
  
  if (recordsWithPulse.length < 2) return null;
  
  return recordsWithPulse.map(record => ({
    date: new Date(record.visitDate).toISOString().split('T')[0],
    systolicBP: record.pulseWave.systolicBP || null,
    diastolicBP: record.pulseWave.diastolicBP || null,
    heartRate: record.pulseWave.heartRate || null,
    pulsePressure: record.pulseWave.pulsePressure || null
  }));
};

// 증상 변화 분석 함수
const analyzeSymptomChanges = (records) => {
  return records.map(record => ({
    date: new Date(record.visitDate).toISOString().split('T')[0],
    symptoms: record.symptoms || record.subjectiveSymptoms || [],
    severity: record.severity || '보통',
    diagnosis: record.diagnosis?.primary || record.diagnosis || '',
    visitType: record.visitType || '진료'
  }));
};

// 테스트용 라우트
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: '환자 데이터 API가 정상적으로 작동합니다.'
  });
});

module.exports = router; 