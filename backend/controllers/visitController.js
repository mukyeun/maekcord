const Patient = require('../models/Patient');
const moment = require('moment-timezone');
const mongoose = require('mongoose');

// 환자의 모든 진료 기록 조회
exports.getPatientVisitHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log('📋 진료 기록 목록 조회 요청:', { patientId, type: typeof patientId });
    
    if (!patientId) {
      console.error('❌ 환자 ID가 없음');
      return res.status(400).json({
        success: false,
        message: '환자 ID가 필요합니다.'
      });
    }

    // ObjectId 유효성 검사 및 변환
    let objectId;
    try {
      if (mongoose.Types.ObjectId.isValid(patientId)) {
        objectId = new mongoose.Types.ObjectId(patientId);
      } else {
        console.error('❌ 유효하지 않은 ObjectId 형식:', patientId);
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 환자 ID 형식입니다.'
        });
      }
    } catch (error) {
      console.error('❌ ObjectId 변환 실패:', error);
      return res.status(400).json({
        success: false,
        message: '환자 ID 형식이 올바르지 않습니다.'
      });
    }

    console.log('🔍 환자 조회 시도:', { originalId: patientId, objectId: objectId.toString() });
    const patient = await Patient.findById(objectId);

    if (!patient) {
      console.log('❌ 환자를 찾을 수 없음:', { patientId, objectId: objectId.toString() });
      return res.status(404).json({
        success: false,
        message: '환자를 찾을 수 없습니다.'
      });
    }

    console.log('✅ 환자 데이터 조회됨:', {
      id: patient._id,
      name: patient.basicInfo?.name,
      hasRecords: patient.records != null,
      recordsCount: patient.records?.length || 0,
      recordsType: typeof patient.records,
      isArray: Array.isArray(patient.records),
      recordSample: patient.records?.[0] ? {
        id: patient.records[0]._id,
        createdAt: patient.records[0].createdAt,
        symptoms: patient.records[0].symptoms
      } : null
    });

    // 진료 기록이 배열인지 확인하고 처리
    let recordsArray = Array.isArray(patient.records) ? patient.records : [];
    if (!Array.isArray(patient.records) && patient.records) {
      recordsArray = [patient.records];
    }

    // 진료 기록을 날짜별로 정렬
    const records = recordsArray
      .filter(record => {
        // createdAt이 없는 경우 date 필드 사용
        const hasValidDate = record && (record.createdAt || record.date);
        if (!hasValidDate) {
          console.log('⚠️ 유효하지 않은 기록 제외:', record);
        }
        return hasValidDate;
      })
      .sort((a, b) => {
        const dateA = new Date(b.createdAt || b.date);
        const dateB = new Date(a.createdAt || a.date);
        return dateA - dateB;
      })
      .map(record => {
        const visitDateTime = record.createdAt || record.date;
        const mappedRecord = {
          visitDateTime: visitDateTime,
          date: moment(visitDateTime).format('YYYY-MM-DD'),
          symptoms: record.symptoms || [],
          memo: record.memo || '',
          stress: record.stress || '',
          pulseAnalysis: record.pulseAnalysis || '',
          pulseWave: record.pulseWave || {},
          medications: record.medications || [],
          macSang: record.macSang || {}
        };
        console.log('🔄 기록 매핑:', {
          original: {
            id: record._id,
            createdAt: record.createdAt,
            date: record.date,
            visitDateTime: visitDateTime,
            hasSymptoms: record.symptoms?.length > 0
          },
          mapped: {
            visitDateTime: mappedRecord.visitDateTime,
            date: mappedRecord.date,
            hasSymptoms: mappedRecord.symptoms.length > 0
          }
        });
        return mappedRecord;
      });

    console.log('✅ 최종 진료 기록:', {
      totalRecords: records.length,
      records: records.map(r => ({
        dateTime: r.visitDateTime,
        date: r.date,
        hasSymptoms: r.symptoms.length > 0,
        hasPulseWave: Object.keys(r.pulseWave).length > 0
      }))
    });

    res.json({
      success: true,
      data: {
        records: records
      }
    });
  } catch (error) {
    console.error('❌ 진료 기록 조회 실패:', {
      error: error.message,
      stack: error.stack,
      patientId: req.params.patientId
    });
    res.status(500).json({
      success: false,
      message: '진료 기록을 불러오는데 실패했습니다.',
      error: error.message
    });
  }
};

// 특정 날짜의 진료 기록 상세 조회
exports.getPatientVisitRecord = async (req, res) => {
  try {
    const { patientId, date } = req.params;
    console.log('진료 기록 상세 조회 요청:', { patientId, date });

    // ObjectId 유효성 검사 및 변환
    let objectId;
    try {
      if (mongoose.Types.ObjectId.isValid(patientId)) {
        objectId = new mongoose.Types.ObjectId(patientId);
      } else {
        console.error('❌ 유효하지 않은 ObjectId 형식:', patientId);
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 환자 ID 형식입니다.'
        });
      }
    } catch (error) {
      console.error('❌ ObjectId 변환 실패:', error);
      return res.status(400).json({
        success: false,
        message: '환자 ID 형식이 올바르지 않습니다.'
      });
    }

    const patient = await Patient.findById(objectId)
      .populate('records')
      .populate('latestPulseWave');

    if (!patient) {
      console.log('환자를 찾을 수 없음:', { patientId, objectId: objectId.toString() });
      return res.status(404).json({ success: false, message: '환자를 찾을 수 없습니다.' });
    }

    console.log('환자 데이터:', {
      name: patient.basicInfo?.name,
      recordsCount: patient.records?.length,
      latestPulseWave: patient.latestPulseWave ? 'exists' : 'none'
    });

    // 정확한 시간까지 매칭하여 진료 기록 찾기
    const targetDateTime = new Date(date);
    console.log('조회할 시간:', targetDateTime);

    // 진료 기록이 배열인지 확인하고 처리
    let recordsArray = Array.isArray(patient.records) ? patient.records : [];
    if (!Array.isArray(patient.records) && patient.records) {
      recordsArray = [patient.records];
    }

    console.log('진료 기록 배열:', recordsArray.map(r => ({
      createdAt: r.createdAt,
      hasSymptoms: r.symptoms?.length > 0,
      hasPulseWave: r.pulseWave ? 'yes' : 'no'
    })));

    const visit = recordsArray.find(record => {
      if (!record || !record.createdAt) return false;
      const recordTime = new Date(record.createdAt);
      const recordMatch = recordTime.getTime() === targetDateTime.getTime();
      console.log('기록 비교:', {
        recordTime: recordTime.toISOString(),
        targetTime: targetDateTime.toISOString(),
        matches: recordMatch
      });
      return recordMatch;
    });

    if (!visit) {
      console.log('해당 시간의 진료 기록을 찾을 수 없음:', {
        targetTime: targetDateTime,
        availableTimes: recordsArray.map(r => r.createdAt)
      });
      return res.status(404).json({ 
        success: false, 
        message: '해당 시간의 진료 기록을 찾을 수 없습니다.',
        requestedTime: targetDateTime
      });
    }

    console.log('조회된 진료 기록:', {
      visitTime: visit.createdAt,
      symptoms: visit.symptoms?.length || 0,
      hasPulseWave: visit.pulseWave ? 'yes' : 'no'
    });

    res.json({
      success: true,
      visit: {
        ...visit.toObject(),
        patientName: patient.basicInfo?.name
      }
    });
  } catch (error) {
    console.error('진료 기록 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      message: '진료 기록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}; 