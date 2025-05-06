const medicalRecordService = require('../services/medicalRecordService');
const logger = require('../utils/logger');
const { USER_ROLES } = require('../config/constants');

const medicalRecordController = {
  // 진료 기록 생성
  createRecord: async (req, res) => {
    try {
      // 의사만 진료 기록 생성 가능
      if (req.user.role !== USER_ROLES.DOCTOR) {
        return res.status(403).json({
          success: false,
          message: 'Only doctors can create medical records'
        });
      }

      const recordData = {
        ...req.body,
        doctorId: req.user.userId
      };

      const record = await medicalRecordService.createRecord(recordData);
      
      res.status(201).json({
        success: true,
        data: record
      });
    } catch (error) {
      logger.error('Create medical record error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // 진료 기록 조회
  getRecord: async (req, res) => {
    try {
      const { recordId } = req.params;
      const record = await medicalRecordService.getRecordById(recordId);
      
      res.json({
        success: true,
        data: record
      });
    } catch (error) {
      logger.error('Get medical record error:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  },

  // 환자의 진료 기록 목록 조회
  getPatientRecords: async (req, res) => {
    try {
      const { patientId } = req.params;
      const { page, limit } = req.query;
      
      const result = await medicalRecordService.getPatientRecords(patientId, page, limit);
      
      res.json({
        success: true,
        data: result.records,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Get patient records error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // 의사의 진료 기록 목록 조회
  getDoctorRecords: async (req, res) => {
    try {
      const doctorId = req.params.doctorId || req.user.userId;
      const { page, limit } = req.query;

      // 다른 의사의 기록을 조회하려면 관리자 권한 필요
      if (doctorId !== req.user.userId && req.user.role !== USER_ROLES.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access to other doctor\'s records'
        });
      }
      
      const result = await medicalRecordService.getDoctorRecords(doctorId, page, limit);
      
      res.json({
        success: true,
        data: result.records,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Get doctor records error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // 진료 기록 수정
  updateRecord: async (req, res) => {
    try {
      const { recordId } = req.params;
      const updateData = req.body;

      // 기존 기록 조회
      const existingRecord = await medicalRecordService.getRecordById(recordId);

      // 작성자나 관리자만 수정 가능
      if (existingRecord.doctorId._id.toString() !== req.user.userId && 
          req.user.role !== USER_ROLES.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to modify this record'
        });
      }

      const record = await medicalRecordService.updateRecord(recordId, updateData);
      
      res.json({
        success: true,
        data: record
      });
    } catch (error) {
      logger.error('Update medical record error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // 진료 기록 삭제
  deleteRecord: async (req, res) => {
    try {
      const { recordId } = req.params;

      // 기존 기록 조회
      const existingRecord = await medicalRecordService.getRecordById(recordId);

      // 작성자나 관리자만 삭제 가능
      if (existingRecord.doctorId._id.toString() !== req.user.userId && 
          req.user.role !== USER_ROLES.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to delete this record'
        });
      }

      const record = await medicalRecordService.deleteRecord(recordId);
      
      res.json({
        success: true,
        data: record
      });
    } catch (error) {
      logger.error('Delete medical record error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = medicalRecordController; 