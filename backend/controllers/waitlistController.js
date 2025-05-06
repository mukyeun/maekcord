const Waitlist = require('../models/Waitlist');
const Patient = require('../models/Patient');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

const waitlistController = {
  // 대기자 등록
  addToWaitlist: async (req, res, next) => {
    try {
      const { patientId, priority, estimatedTime, note } = req.body;

      // 환자 존재 여부 확인
      const patient = await Patient.findById(patientId);
      if (!patient) {
        throw new NotFoundError('환자를 찾을 수 없습니다.');
      }

      // 이미 대기 중인지 확인
      const existingWaitlist = await Waitlist.findOne({
        patientId,
        status: 'waiting',
        date: moment().startOf('day').toDate()
      });

      if (existingWaitlist) {
        throw new ValidationError('이미 대기 중인 환자입니다.');
      }

      const waitlist = new Waitlist({
        patientId,
        priority: priority || 1,
        estimatedTime,
        note,
        registeredBy: req.user.id,
        date: moment().startOf('day').toDate()
      });

      await waitlist.save();

      // 환자 기록에 대기 등록 활동 추가
      patient.addActivityLog('waitlist_added', 
        `대기 등록${priority > 1 ? ' (우선순위)' : ''}${note ? `: ${note}` : ''}`, 
        req.user.id
      );
      await patient.save();

      logger.info(`Added to waitlist: Patient ${patientId}, Priority: ${priority}`);

      res.status(201).json({
        success: true,
        message: '대기자 명단에 등록되었습니다.',
        data: waitlist
      });
    } catch (error) {
      logger.error('Waitlist addition failed:', error);
      next(error);
    }
  },

  // 대기 상태 변경
  updateWaitlistStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      if (!['waiting', 'called', 'cancelled', 'completed'].includes(status)) {
        throw new ValidationError('유효하지 않은 상태값입니다.');
      }

      const waitlist = await Waitlist.findById(id);
      if (!waitlist) {
        throw new NotFoundError('대기자를 찾을 수 없습니다.');
      }

      const previousStatus = waitlist.status;
      waitlist.status = status;
      waitlist.statusNote = note;
      waitlist.statusChangedAt = new Date();
      waitlist.statusChangedBy = req.user.id;

      if (status === 'called') {
        waitlist.calledAt = new Date();
      } else if (status === 'completed') {
        waitlist.completedAt = new Date();
      }

      await waitlist.save();

      // 환자 기록에 대기 상태 변경 활동 추가
      const patient = await Patient.findById(waitlist.patientId);
      if (patient) {
        patient.addActivityLog('waitlist_status_changed',
          `대기 상태 변경: ${previousStatus} → ${status}${note ? ` (${note})` : ''}`,
          req.user.id
        );
        await patient.save();
      }

      logger.info(`Waitlist status updated: ${id}, ${previousStatus} → ${status}`);

      res.json({
        success: true,
        message: '대기 상태가 변경되었습니다.',
        data: waitlist
      });
    } catch (error) {
      logger.error('Waitlist status update failed:', error);
      next(error);
    }
  },

  // 대기자 목록 조회
  getWaitlist: async (req, res, next) => {
    try {
      const { 
        date = moment().format('YYYY-MM-DD'),
        status,
        priority
      } = req.query;

      const query = {
        date: moment(date).startOf('day').toDate()
      };

      if (status) {
        query.status = status;
      }

      if (priority) {
        query.priority = parseInt(priority);
      }

      const waitlist = await Waitlist.find(query)
        .populate('patientId', 'name patientId contact')
        .sort({ priority: -1, registeredAt: 1 });

      // 대기 시간 계산
      const waitlistWithTimes = waitlist.map(entry => {
        const waitTime = entry.calledAt ? 
          moment(entry.calledAt).diff(entry.registeredAt, 'minutes') : 
          moment().diff(entry.registeredAt, 'minutes');

        return {
          ...entry.toObject(),
          waitTime
        };
      });

      logger.info(`Retrieved ${waitlist.length} waitlist entries for ${date}`);

      res.json({
        success: true,
        message: `${waitlist.length}명의 대기자가 조회되었습니다.`,
        data: waitlistWithTimes
      });
    } catch (error) {
      logger.error('Waitlist retrieval failed:', error);
      next(error);
    }
  },

  // 대기자 삭제
  removeFromWaitlist: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const waitlist = await Waitlist.findById(id);
      if (!waitlist) {
        throw new NotFoundError('대기자를 찾을 수 없습니다.');
      }

      // 이미 완료된 대기는 삭제 불가
      if (waitlist.status === 'completed') {
        throw new ValidationError('이미 완료된 대기는 삭제할 수 없습니다.');
      }

      waitlist.status = 'cancelled';
      waitlist.statusNote = reason;
      waitlist.statusChangedAt = new Date();
      waitlist.statusChangedBy = req.user.id;
      await waitlist.save();

      // 환자 기록에 대기 취소 활동 추가
      const patient = await Patient.findById(waitlist.patientId);
      if (patient) {
        patient.addActivityLog('waitlist_cancelled',
          `대기 취소${reason ? ` (사유: ${reason})` : ''}`,
          req.user.id
        );
        await patient.save();
      }

      logger.info(`Removed from waitlist: ${id}`);

      res.json({
        success: true,
        message: '대기자가 명단에서 제거되었습니다.',
        data: waitlist
      });
    } catch (error) {
      logger.error('Waitlist removal failed:', error);
      next(error);
    }
  }
};

module.exports = waitlistController;