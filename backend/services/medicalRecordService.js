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
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { visitDate: -1 }
      };

      const records = await MedicalRecord.find({ 
        patientId, 
        isActive: true 
      })
        .populate('doctorId', 'name')
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .sort(options.sort);

      const total = await MedicalRecord.countDocuments({ 
        patientId, 
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
      logger.error('Get patient records error:', error);
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