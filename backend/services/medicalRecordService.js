const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const logger = require('../utils/logger');

const medicalRecordService = {
  // 진료 기록 생성
  createRecord: async (recordData) => {
    try {
      // 환자 존재 여부 확인
      const patient = await Patient.findOne({ 
        patientId: recordData.patientId,
        isActive: true 
      });
      
      if (!patient) {
        throw new Error('Patient not found');
      }

      const record = new MedicalRecord(recordData);
      await record.save();
      
      return record;
    } catch (error) {
      logger.error('Create medical record error:', error);
      throw error;
    }
  },

  // 진료 기록 조회
  getRecordById: async (recordId) => {
    try {
      const record = await MedicalRecord.findOne({ recordId, isActive: true })
        .populate('doctorId', 'name');
      
      if (!record) {
        throw new Error('Medical record not found');
      }
      
      return record;
    } catch (error) {
      logger.error('Get medical record error:', error);
      throw error;
    }
  },

  // 환자의 진료 기록 목록 조회
  getPatientRecords: async (patientId, page = 1, limit = 10) => {
    try {
      logger.info(`🔍 진료 기록 조회 시작 - 환자 ID: ${patientId}`);
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { visitDate: -1 }
      };

      // MedicalRecord 모델에서 기록 조회
      const [medicalRecords, medicalRecordTotal] = await Promise.all([
        MedicalRecord.find({ 
          patientId, 
          isActive: true 
        })
          .populate('doctorId', 'name')
          .skip((options.page - 1) * options.limit)
          .limit(options.limit)
          .sort(options.sort),
        MedicalRecord.countDocuments({ 
          patientId, 
          isActive: true 
        })
      ]);

      logger.info(`📊 MedicalRecord 모델 검색 결과: ${medicalRecords.length}개 기록 발견`);

      // Patient 모델에서 records 배열 조회
      const patient = await Patient.findOne({ patientId })
        .select('records')
        .lean();

      logger.info(`👤 Patient 모델 검색 결과: ${patient ? '환자 발견' : '환자 없음'}`);
      logger.info(`📝 Patient 기록 수: ${patient?.records?.length || 0}개`);

      // 두 모델의 기록 병합
      let allRecords = [...medicalRecords];
      if (patient?.records) {
        // Patient 모델의 records를 MedicalRecord 형식으로 변환
        const patientRecords = patient.records.map(record => {
          logger.info(`🔄 레거시 기록 변환 - 날짜: ${record.visitDateTime || record.date}`);
          return {
            recordId: `OLD_${record._id}`,
            patientId,
            visitDate: record.visitDateTime || record.date,
            symptoms: Array.isArray(record.symptoms) ? record.symptoms.join(', ') : record.symptoms || '',
            diagnosis: record.pulseAnalysis || '',
            treatment: record.medications ? record.medications.join(', ') : '',
            notes: record.memo || '',
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            isLegacyRecord: true
          };
        });
        
        allRecords = [...allRecords, ...patientRecords];
        logger.info(`🔄 전체 기록 병합 완료 - 총 ${allRecords.length}개`);
      }

      // 날짜순 정렬
      allRecords.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

      // 페이지네이션 적용
      const total = medicalRecordTotal + (patient?.records?.length || 0);
      const paginatedRecords = allRecords.slice(
        (options.page - 1) * options.limit,
        options.page * options.limit
      );

      logger.info(`📊 최종 반환 기록 수: ${paginatedRecords.length}개 (전체: ${total}개)`);

      return {
        records: paginatedRecords,
        pagination: {
          total,
          page: options.page,
          pages: Math.ceil(total / options.limit)
        }
      };
    } catch (error) {
      logger.error('❌ 진료 기록 조회 실패:', error);
      throw error;
    }
  },

  // 의사의 진료 기록 목록 조회
  getDoctorRecords: async (doctorId, page = 1, limit = 10) => {
    try {
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { visitDate: -1 }
      };

      const records = await MedicalRecord.find({ 
        doctorId, 
        isActive: true 
      })
        .populate('doctorId', 'name')
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .sort(options.sort);

      const total = await MedicalRecord.countDocuments({ 
        doctorId, 
        isActive: true 
      });

      return {
        records,
        pagination: {
          total,
          page: options.page,
          pages: Math.ceil(total / options.limit)
        }
      };
    } catch (error) {
      logger.error('Get doctor records error:', error);
      throw error;
    }
  },

  // 진료 기록 수정
  updateRecord: async (recordId, updateData) => {
    try {
      const record = await MedicalRecord.findOneAndUpdate(
        { recordId, isActive: true },
        { $set: updateData },
        { 
          new: true,
          runValidators: true 
        }
      ).populate('doctorId', 'name');

      if (!record) {
        throw new Error('Medical record not found');
      }

      return record;
    } catch (error) {
      logger.error('Update medical record error:', error);
      throw error;
    }
  },

  // 진료 기록 삭제 (비활성화)
  deleteRecord: async (recordId) => {
    try {
      const record = await MedicalRecord.findOneAndUpdate(
        { recordId, isActive: true },
        { $set: { isActive: false } },
        { new: true }
      );

      if (!record) {
        throw new Error('Medical record not found');
      }

      return record;
    } catch (error) {
      logger.error('Delete medical record error:', error);
      throw error;
    }
  }
};

module.exports = medicalRecordService; 