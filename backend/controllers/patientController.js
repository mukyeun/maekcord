const Patient = require('../models/Patient');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

const patientController = {
  // 환자 생성
  createPatient: async (req, res, next) => {
    try {
      const patient = new Patient(req.body);
      patient.addActivityLog('created', '환자 등록', req.user.id);
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
      const updateData = req.body;
      
      // 수정 불가능한 필드 제거
      delete updateData.patientId;
      delete updateData.createdAt;
      delete updateData.activityLog;
      
      const patient = await Patient.findById(id);
      if (!patient) {
        throw new NotFoundError('환자를 찾을 수 없습니다.');
      }

      // 수정된 필드들 추적
      const modifiedFields = Object.keys(updateData)
        .filter(key => updateData[key] !== patient[key])
        .join(', ');

      Object.assign(patient, updateData);
      patient.addActivityLog('updated', `수정된 정보: ${modifiedFields}`, req.user.id);
      await patient.save();

      logger.info(`Patient updated: ${patient.patientId}, Modified fields: ${modifiedFields}`);

      res.json({
        success: true,
        message: '환자 정보가 수정되었습니다.',
        data: patient
      });
    } catch (error) {
      logger.error('Patient update failed:', error);
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
      const { 
        page = 1, 
        limit = 10, 
        status,
        search,
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;

      const query = {};
      
      if (status) {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { patientId: new RegExp(search, 'i') },
          { 'contact.phone': new RegExp(search, 'i') }
        ];
      }

      const [patients, total] = await Promise.all([
        Patient.find(query)
          .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit)),
        Patient.countDocuments(query)
      ]);

      logger.info(`Retrieved ${patients.length} patients`);

      res.json({
        success: true,
        message: `${total}명의 환자가 조회되었습니다.`,
        data: {
          patients,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Patient retrieval failed:', error);
      next(error);
    }
  },

  // 환자 상세 조회
  getPatient: async (req, res, next) => {
    try {
      const { id } = req.params;
      const patient = await Patient.findById(id);
      
      if (!patient) {
        throw new NotFoundError('환자를 찾을 수 없습니다.');
      }

      logger.info(`Retrieved patient details: ${patient.patientId}`);

      res.json({
        success: true,
        data: patient
      });
    } catch (error) {
      logger.error('Patient detail retrieval failed:', error);
      next(error);
    }
  }
};

module.exports = patientController;
