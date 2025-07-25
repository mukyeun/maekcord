const Patient = require('../models/Patient');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { logger } = require('../utils/logger');

const patientController = {
  // 환자 생성
  createPatient: async (req, res, next) => {
    try {
      if (!req.body.patientId) {
        req.body.patientId = await Patient.generateUniqueId();
      }
      const patient = new Patient(req.body);
      patient.addActivityLog('created', '환자 등록', req.user?.id || 'system');
      await patient.save();

      logger.info(`New patient created: ${patient.patientId}`);
      
      res.status(201).json({
        success: true,
        message: '환자가 등록되었습니다.',
        data: patient
      });
    } catch (error) {
      logger.error('Patient creation failed:', error);
      next(error);
    }
  },

  // 환자 정보 수정
  updatePatient: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { basicInfo, records, ...otherData } = req.body;

      const updateOps = { $set: {} };

      // basicInfo 필드가 있으면 $set 연산자에 추가
      if (basicInfo) {
        // 'basicInfo.name', 'basicInfo.phone' 과 같은 형태로 만들어줌
        Object.keys(basicInfo).forEach(key => {
          updateOps.$set[`basicInfo.${key}`] = basicInfo[key];
        });
      }

      // records를 제외한 다른 최상위 필드들도 $set에 추가
      Object.keys(otherData).forEach(key => {
        // MongoDB가 관리하는 필드는 업데이트에서 제외
        if (key !== '_id' && key !== 'patientId' && key !== 'createdAt' && key !== 'updatedAt') {
          updateOps.$set[key] = otherData[key];
        }
      });

      // 업데이트할 내용이 없으면 아무것도 하지 않음
      if (Object.keys(updateOps.$set).length === 0 && (!records || records.length === 0)) {
        return res.status(200).json({ 
          success: true, 
          message: '업데이트할 내용이 없습니다.',
          data: await Patient.findById(id) // 현재 환자 정보 반환
        });
      }

      // 새 진료기록(records)이 있으면 $push 연산자로 추가
      if (records && Array.isArray(records) && records.length > 0) {
        updateOps.$push = { records: { $each: records, $position: 0 } }; // 최신 기록이 배열 맨 앞에 오도록
      }
      
      // 활동 로그 추가
      updateOps.$push = {
        ...(updateOps.$push || {}), // 기존 $push가 있을 수 있으므로 병합
        activityLog: {
          action: 'updated',
          description: '환자 정보가 수정되었습니다.',
          userId: req.user?.id || 'system',
          timestamp: new Date()
        }
      };

      const updatedPatient = await Patient.findByIdAndUpdate(
        id,
        updateOps,
        { new: true, runValidators: true, context: 'query' }
      );

      if (!updatedPatient) {
        throw new NotFoundError('업데이트할 환자를 찾을 수 없습니다.');
      }

      logger.info(`Patient updated: ${updatedPatient.patientId}`);

      res.json({
        success: true,
        message: '환자 정보가 수정되었습니다.',
        data: updatedPatient
      });
    } catch (error) {
      logger.error('Patient update failed:', { 
        message: error.message, 
        name: error.name
      });

      if (error instanceof NotFoundError) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error instanceof ValidationError || error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: '입력 데이터가 올바르지 않습니다.',
          error: error.message,
          details: error.errors
        });
      }

      next(error);
    }
  },

  // 환자 상태 변경
  updateStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!['active', 'inactive'].includes(status)) {
        throw new ValidationError('유효하지 않은 상태값입니다.');
      }

      const patient = await Patient.findById(id);
      if (!patient) {
        throw new NotFoundError('환자를 찾을 수 없습니다.');
      }

      const previousStatus = patient.status;
      patient.status = status;
      patient.inactiveReason = status === 'inactive' ? reason : undefined;
      patient.addActivityLog(
        'status_changed',
        `상태 변경: ${previousStatus} → ${status}${reason ? ` (사유: ${reason})` : ''}`,
        req.user.id
      );

      await patient.save();

      logger.info(`Patient status updated: ${patient.patientId}, ${previousStatus} → ${status}`);

      res.json({
        success: true,
        message: '환자 상태가 변경되었습니다.',
        data: patient
      });
    } catch (error) {
      logger.error('Patient status update failed:', error);
      next(error);
    }
  },

  // 환자 목록 조회
  getPatients: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
      
      const patients = await Patient.find()
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
      
      const total = await Patient.countDocuments();
      
      logger.info(`Patients retrieved: ${patients.length} of ${total}`);
      
      res.json({
        success: true,
        data: patients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Patient retrieval failed:', error);
      next(error);
    }
  },

  // 환자 상세 조회
  getPatientById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const patient = await Patient.findById(id).lean();
      
      if (!patient) {
        throw new NotFoundError('환자를 찾을 수 없습니다.');
      }
      
      logger.info(`Patient retrieved: ${patient.patientId}`);
      
      res.json({
        success: true,
        data: patient
      });
    } catch (error) {
      logger.error('Patient retrieval failed:', error);
      next(error);
    }
  },

  // 환자 검색
  searchPatients: async (req, res, next) => {
    try {
      const { q, page = 1, limit = 10 } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: '검색어를 입력해주세요.'
        });
      }
      
      const skip = (page - 1) * limit;
      
      const searchQuery = {
        $or: [
          { 'basicInfo.name': { $regex: q, $options: 'i' } },
          { 'basicInfo.phone': { $regex: q, $options: 'i' } },
          { 'basicInfo.residentNumber': { $regex: q, $options: 'i' } },
          { patientId: { $regex: q, $options: 'i' } }
        ]
      };
      
      const patients = await Patient.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
      
      const total = await Patient.countDocuments(searchQuery);
      
      logger.info(`Patient search completed: ${patients.length} results for "${q}"`);
      
      res.json({
        success: true,
        data: patients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Patient search failed:', error);
      next(error);
    }
  },

  // 환자 삭제
  deletePatient: async (req, res, next) => {
    try {
      const { id } = req.params;
      const patient = await Patient.findByIdAndDelete(id);
      
      if (!patient) {
        throw new NotFoundError('삭제할 환자를 찾을 수 없습니다.');
      }
      
      logger.info(`Patient deleted: ${patient.patientId}`);
      
      res.json({
        success: true,
        message: '환자가 삭제되었습니다.'
      });
    } catch (error) {
      logger.error('Patient deletion failed:', error);
      next(error);
    }
  },

  // ✅ 환자 등록
  registerPatient: async (req, res, next) => {
    try {
      const formData = req.body;
      console.log('📝 환자 등록 요청 데이터:', JSON.stringify(formData, null, 2));

      if (formData.basicInfo.residentNumber) {
        const existingPatient = await Patient.findOne({
          'basicInfo.residentNumber': formData.basicInfo.residentNumber
        });

        if (existingPatient) {
          return res.status(409).json({
            success: false,
            message: '이미 등록된 환자입니다.',
            patientId: existingPatient.patientId,
            _id: existingPatient._id
          });
        }
      }

      const patientId = await Patient.generateUniqueId();
      
      // 스트레스 데이터 정제 및 검증
      let stressData = null;
      try {
        if (formData.stress) {
          stressData = {
            level: formData.stress.level || 'normal',
            score: Number(formData.stress.score || formData.stress.totalScore || 0),
            items: Array.isArray(formData.stress.items) 
              ? formData.stress.items.map(item => 
                  typeof item === 'string' ? item : (item?.name || '')
                ).filter(Boolean)
              : [],
            measuredAt: formData.stress.measuredAt || new Date()
          };
        } else if (formData.records?.stress) {
          // records.stress에서도 찾기
          stressData = {
            level: formData.records.stress.level || 'normal',
            score: Number(formData.records.stress.score || formData.records.stress.totalScore || 0),
            items: Array.isArray(formData.records.stress.items) 
              ? formData.records.stress.items.map(item => 
                  typeof item === 'string' ? item : (item?.name || '')
                ).filter(Boolean)
              : [],
            measuredAt: formData.records.stress.measuredAt || new Date()
          };
        }
      } catch (stressError) {
        console.error('❌ 스트레스 데이터 정제 오류:', stressError);
        stressData = {
          level: 'normal',
          score: 0,
          items: [],
          measuredAt: new Date()
        };
      }
      
      const patientData = {
        ...formData,
        patientId,
        status: 'active',
        symptoms: Array.isArray(formData.symptoms) ? formData.symptoms : [],
        medication: formData.medication || {},
        stress: stressData || {
          level: 'normal',
          score: 0,
          items: [],
          measuredAt: new Date()
        },
      };
      
      const initialRecord = {};
      let hasRecordData = false;
      
      if (Array.isArray(formData.symptoms) && formData.symptoms.length > 0) {
        initialRecord.symptoms = formData.symptoms;
        hasRecordData = true;
      }
      
      if (formData.memo) {
        initialRecord.memo = formData.memo;
        hasRecordData = true;
      }
      
      // 스트레스 데이터는 항상 저장 (정제된 데이터 사용)
      if (stressData) {
        initialRecord.stress = stressData;
        hasRecordData = true;
      }
      
      if (formData.records?.pulseWave) {
        try {
          initialRecord.pulseWave = {
            systolicBP: Number(formData.records.pulseWave.systolicBP) || 0,
            diastolicBP: Number(formData.records.pulseWave.diastolicBP) || 0,
            heartRate: Number(formData.records.pulseWave.heartRate) || 0,
            pulsePressure: Number(formData.records.pulseWave.pulsePressure) || 0,
            'a-b': Number(formData.records.pulseWave['a-b']) || 0,
            'a-c': Number(formData.records.pulseWave['a-c']) || 0,
            'a-d': Number(formData.records.pulseWave['a-d']) || 0,
            'a-e': Number(formData.records.pulseWave['a-e']) || 0,
            'b/a': Number(formData.records.pulseWave['b/a']) || 0,
            'c/a': Number(formData.records.pulseWave['c/a']) || 0,
            'd/a': Number(formData.records.pulseWave['d/a']) || 0,
            'e/a': Number(formData.records.pulseWave['e/a']) || 0,
            elasticityScore: Number(formData.records.pulseWave.elasticityScore) || 0,
            PVC: Number(formData.records.pulseWave.PVC) || 0,
            BV: Number(formData.records.pulseWave.BV) || 0,
            SV: Number(formData.records.pulseWave.SV) || 0,
            lastUpdated: new Date()
          };
          hasRecordData = true;
        } catch (pulseError) {
          console.error('❌ 맥파 데이터 정제 오류:', pulseError);
        }
      }
      
      if (formData.records?.macSang) {
        initialRecord.macSang = formData.records.macSang;
        hasRecordData = true;
      }

      // 약물 데이터는 항상 저장 (빈 배열이라도)
      if (Array.isArray(formData.medication?.current)) {
        initialRecord.medications = formData.medication.current;
        hasRecordData = true;
      }
      
      if (Array.isArray(formData.medication?.preferences)) {
        initialRecord.preferences = formData.medication.preferences;
        hasRecordData = true;
      }

      // 증상, 메모, 스트레스, 약물 중 하나라도 있으면 record 생성
      patientData.records = hasRecordData ? [initialRecord] : [];
      
      console.log('✅ 저장할 전체 데이터:', JSON.stringify(patientData, null, 2));
      
      const newPatient = new Patient(patientData);
      newPatient.addActivityLog('register', '신규 환자 등록', req.user?.id || 'system');
      await newPatient.save();
      
      console.log('✅ 환자 등록 완료:', newPatient._id);

      res.status(201).json({
        success: true,
        message: '환자가 등록되었습니다.',
        data: newPatient
      });
    } catch (error) {
      console.error('❌ 환자 등록 오류:', error);
      
      // 상세한 오류 정보 로깅
      if (error.name === 'ValidationError') {
        console.error('❌ 검증 오류 상세:', {
          message: error.message,
          errors: error.errors
        });
      }
      
      logger.error('Patient creation failed:', error);
      next(error);
    }
  },

  // ✅ 환자 중복 체크
  checkPatient: async (req, res) => {
    try {
      const { 'basicInfo.residentNumber': residentNumber } = req.body;
      
      const existingPatient = await Patient.findOne({
        'basicInfo.residentNumber': residentNumber
      });

      if (existingPatient) {
        return res.json({
          exists: true,
          patientId: existingPatient.patientId
        });
      }

      res.json({
        exists: false,
        patientId: null
      });
    } catch (error) {
      console.error('❌ 환자 중복 체크 오류:', error);
      res.status(500).json({
        success: false,
        message: error.message || '환자 중복 체크 중 오류가 발생했습니다.'
      });
    }
  },

  handleSave: async (req, res) => {
    try {
      console.log('🟡 저장 시작 - 폼 데이터:', req.body);

      const sanitized = sanitizeFormData(req.body);
      console.log('🟢 정제된 환자 데이터:', sanitized);

      const res = await registerPatient(sanitized);
      console.log('👤 환자 등록 응답:', res);

      // ✅ 환자 ID 추출
      const patientId = res?.data?.patient?._id;

      if (!patientId) {
        console.error('❌ 응답에서 유효한 환자 ID 없음:', res);
        throw new Error('환자 ID를 받아오지 못했습니다');
      }

      console.log('✅ 등록된 환자 ID:', patientId);

      // 이후 queue 등록 및 후속 처리 로직...
      const sequenceNumber = await generateSequenceNumber(patientId);
      console.log('🎫 생성된 순번:', sequenceNumber);

      const queueData = {
        patientId,
        sequenceNumber,
        visitType: req.body.basicInfo?.visitType || '초진',
        symptoms: sanitized.symptoms,
        status: 'waiting',
        date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      };

      console.log('📥 대기열 등록 요청 데이터:', queueData);

      const queueRes = await registerQueue(queueData);
      console.log('📋 대기열 등록 결과:', queueRes);

      if (queueRes.success) {
        message.success('환자 등록 및 대기열 추가 완료');
        onClose(); // 모달 닫기 등 후처리
      } else {
        message.warning(queueRes.message || '대기열 등록 중 오류 발생');
      }

    } catch (error) {
      console.error('❌ 저장 중 오류:', error);
      message.error(error.message || '저장 중 오류 발생');
    }
  }
};

module.exports = patientController;