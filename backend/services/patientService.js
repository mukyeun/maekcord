const Patient = require('../models/Patient');
const logger = require('../utils/logger');

const patientService = {
  // 환자 등록
  createPatient: async (patientData, registeredBy) => {
    try {
      const patient = new Patient({
        ...patientData,
        registeredBy
      });
      
      await patient.save();
      return patient;
    } catch (error) {
      logger.error('Create patient error:', error);
      throw error;
    }
  },

  // 환자 정보 조회
  getPatientById: async (patientId) => {
    try {
      const patient = await Patient.findOne({ patientId, isActive: true });
      if (!patient) {
        throw new Error('Patient not found');
      }
      return patient;
    } catch (error) {
      logger.error('Get patient error:', error);
      throw error;
    }
  },

  // 환자 목록 조회 (페이지네이션)
  getPatients: async (query = {}, page = 1, limit = 10) => {
    try {
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 }
      };

      const patients = await Patient.find({ isActive: true, ...query })
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .sort(options.sort);

      const total = await Patient.countDocuments({ isActive: true, ...query });

      return {
        patients,
        pagination: {
          total,
          page: options.page,
          pages: Math.ceil(total / options.limit)
        }
      };
    } catch (error) {
      logger.error('Get patients error:', error);
      throw error;
    }
  },

  // 환자 정보 수정
  updatePatient: async (patientId, updateData) => {
    try {
      const patient = await Patient.findOne({ patientId });
      if (!patient) {
        throw new Error('Patient not found');
      }

      delete updateData.patientId;
      delete updateData.registeredBy;

      Object.assign(patient, updateData);
      await patient.save();

      return patient;
    } catch (error) {
      logger.error('Update patient error:', error);
      throw error;
    }
  },

  // 환자 비활성화 (삭제 대신)
  deactivatePatient: async (patientId) => {
    try {
      const patient = await Patient.findOne({ patientId, isActive: true });
      if (!patient) {
        throw new Error('Patient not found');
      }

      patient.isActive = false;
      await patient.save();

      return patient;
    } catch (error) {
      logger.error('Deactivate patient error:', error);
      throw error;
    }
  },

  // 환자 검색
  searchPatients: async (searchTerm, page = 1, limit = 10) => {
    try {
      const query = {
        isActive: true,
        $or: [
          { patientId: new RegExp(searchTerm, 'i') },
          { name: new RegExp(searchTerm, 'i') }
        ]
      };

      return await patientService.getPatients(query, page, limit);
    } catch (error) {
      logger.error('Search patients error:', error);
      throw error;
    }
  }
};

module.exports = patientService; 