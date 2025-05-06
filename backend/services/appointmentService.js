const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { APPOINTMENT_STATUS, USER_ROLES } = require('../config/constants');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const appointmentAggregations = require('./appointmentAggregations');
const moment = require('moment-timezone');
const Waitlist = require('../models/Waitlist');
const { AppError, ForbiddenError } = require('../utils/errors');
const appointmentConfig = require('../config/appointmentConfig');
const AppointmentHistory = require('../models/appointmentHistory');

const appointmentService = {
  // 시간대 중복 체크
  async checkTimeSlotAvailability(doctorId, startTime, endTime) {
    try {
      const conflictingAppointment = await Appointment.findOne({
        doctorId,
        status: { $ne: 'cancelled' },
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          }
        ]
      });

      return {
        isAvailable: !conflictingAppointment,
        conflictingAppointment
      };
    } catch (error) {
      logger.error('Check time slot availability error:', error);
      throw error;
    }
  },

  // 예약 생성
  async createAppointment(appointmentData) {
    try {
      // 시간 중복 체크
      const { isAvailable, conflictingAppointment } = await appointmentService.checkTimeSlotAvailability(
        appointmentData.doctorId,
        appointmentData.startTime,
        appointmentData.endTime
      );

      if (!isAvailable) {
        throw new Error('Selected time slot is already booked');
      }

      // 환자 존재 여부 확인 (User 모델에서 확인)
      const patient = await User.findOne({ 
        _id: appointmentData.patientId,
        role: 'patient'
      });
      if (!patient) {
        throw new Error(`Patient not found: ${appointmentData.patientId}`);
      }

      // 의사 존재 여부 확인
      const doctor = await User.findOne({ 
        _id: appointmentData.doctorId,
        role: 'doctor'
      });
      if (!doctor) {
        throw new Error(`Doctor not found: ${appointmentData.doctorId}`);
      }

      logger.info('Creating appointment with data:', {
        patientId: appointmentData.patientId,
        doctorId: appointmentData.doctorId,
        startTime: appointmentData.startTime,
        endTime: appointmentData.endTime
      });

      const appointment = new Appointment(appointmentData);
      await appointment.save();

      return appointment;
    } catch (error) {
      logger.error('Create appointment error:', error);
      throw error;
    }
  },

  // 예약 조회
  getAppointmentById: async (appointmentId) => {
    try {
      const appointment = await Appointment.findOne({ 
        appointmentId,
        isActive: true 
      })
        .populate('doctorId', 'name')
        .populate('canceledBy', 'name');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      return appointment;
    } catch (error) {
      logger.error('Get appointment error:', error);
      throw error;
    }
  },

  // 환자별 예약 이력 조회
  getPatientAppointments: async (patientId, page = 1, limit = 10) => {
    try {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const patientObjectId = new mongoose.Types.ObjectId(patientId);

      // 전체 예약 조회 (통계용)
      const allAppointments = await Appointment.find({
        patientId: patientObjectId,
        isActive: true
      })
        .select('status')
        .lean();

      // 통계 데이터 계산
      const statistics = {
        total: allAppointments.length,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        scheduled: 0
      };

      allAppointments.forEach(appointment => {
        statistics[appointment.status]++;
      });

      // 페이지네이션된 예약 목록 조회
      const appointments = await Appointment.find({
        patientId: patientObjectId,
        isActive: true
      })
        .select('appointmentId patientId doctorId scheduledAt duration status symptoms notes cancellation createdAt updatedAt')
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // 환자 정보 조회
      const patient = await Patient.findById(patientObjectId)
        .select('name patientId')
        .lean();

      // 의사 ID 목록 추출
      const doctorIds = [...new Set(appointments.map(a => a.doctorId))];
      
      // 의사 정보 조회
      const doctors = await User.find({
        _id: { $in: doctorIds }
      })
        .select('name')
        .lean();

      // 의사 정보를 Map으로 변환
      const doctorMap = new Map(doctors.map(d => [d._id.toString(), d]));

      // 예약 정보에 환자와 의사 정보 추가
      const enrichedAppointments = appointments.map(appointment => ({
        id: appointment._id,
        appointmentId: appointment.appointmentId,
        patient: {
          id: appointment.patientId,
          name: patient?.name,
          patientNumber: patient?.patientId
        },
        doctor: {
          id: appointment.doctorId,
          name: doctorMap.get(appointment.doctorId.toString())?.name
        },
        schedule: {
          date: moment(appointment.scheduledAt).format('YYYY-MM-DD'),
          time: moment(appointment.scheduledAt).format('HH:mm:ss'),
          duration: appointment.duration
        },
        status: appointment.status,
        symptoms: appointment.symptoms,
        notes: appointment.notes,
        cancellation: appointment.cancellation ? {
          reason: appointment.cancellation.reason,
          reasonCategory: appointment.cancellation.reasonCategory,
          cancelledAt: moment(appointment.cancellation.cancelledAt).format('YYYY-MM-DD HH:mm:ss')
        } : null,
        timestamps: {
          created: moment(appointment.createdAt).format('YYYY-MM-DD HH:mm:ss'),
          updated: moment(appointment.updatedAt).format('YYYY-MM-DD HH:mm:ss')
        }
      }));

      return {
        statistics,
        appointments: enrichedAppointments,
        pagination: {
          total: statistics.total,
          page: parseInt(page),
          pages: Math.ceil(statistics.total / parseInt(limit))
        }
      };
    } catch (error) {
      console.error('Get patient appointments error:', error);
      throw error;
    }
  },

  // 의사의 예약 목록 조회
  getDoctorAppointments: async (doctorId, startDate, endDate, page = 1, limit = 10) => {
    try {
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { appointmentDate: 1 }
      };

      const query = { 
        doctorId,
        isActive: true
      };

      if (startDate && endDate) {
        query.appointmentDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // 예약 목록 조회
      const appointments = await Appointment.find(query)
        .populate('doctorId', 'name')
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .sort(options.sort)
        .lean();

      // 환자 정보 조회 및 추가
      const results = await Promise.all(appointments.map(async (appointment) => {
        const patient = await Patient.findOne({ patientId: appointment.patientId }).select('name contact patientId').lean();
        return {
          ...appointment,
          patient: patient ? {
            patientId: patient.patientId,
            name: patient.name,
            phone: patient.contact?.phone
          } : null
        };
      }));

      const total = await Appointment.countDocuments(query);

      return {
        appointments: results,
        pagination: {
          total,
          page: options.page,
          pages: Math.ceil(total / options.limit)
        }
      };
    } catch (error) {
      logger.error('Get doctor appointments error:', error);
      throw error;
    }
  },

  // 예약 수정
  updateAppointment: async (appointmentId, updateData) => {
    try {
      // 예약 상태가 변경되는 경우 추가 정보 설정
      if (updateData.status === APPOINTMENT_STATUS.CANCELED) {
        updateData.canceledAt = new Date();
      }

      const appointment = await Appointment.findOneAndUpdate(
        { appointmentId, isActive: true },
        { $set: updateData },
        { 
          new: true,
          runValidators: true 
        }
      ).populate('doctorId', 'name');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      return appointment;
    } catch (error) {
      logger.error('Update appointment error:', error);
      throw error;
    }
  },

  // 예약 취소
  async cancelAppointment(appointmentId, userId, reason) {
    try {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        throw new AppError('예약을 찾을 수 없습니다.', 404);
      }

      // 취소 가능 시간 확인
      const now = new Date();
      const appointmentStart = new Date(appointment.startTime);
      const timeUntilAppointment = appointmentStart - now;

      if (timeUntilAppointment < appointmentConfig.CANCELLATION_DEADLINE) {
        throw new ForbiddenError('예약 시작 24시간 전까지만 취소가 가능합니다.');
      }

      // 패널티 계산
      const hoursUntilAppointment = timeUntilAppointment / (60 * 60 * 1000);
      let penaltyLevel = 'NONE';

      if (hoursUntilAppointment < appointmentConfig.PENALTY_THRESHOLDS.HEAVY) {
        penaltyLevel = 'HEAVY';
      } else if (hoursUntilAppointment < appointmentConfig.PENALTY_THRESHOLDS.MEDIUM) {
        penaltyLevel = 'MEDIUM';
      } else if (hoursUntilAppointment < appointmentConfig.PENALTY_THRESHOLDS.LIGHT) {
        penaltyLevel = 'LIGHT';
      }

      // 취소 처리
      const previousStatus = appointment.status;
      appointment.status = 'cancelled';
      appointment.cancellation = {
        reason: reason.code,
        detail: reason.detail,
        cancelledAt: now,
        penaltyLevel
      };

      await appointment.save();

      // 히스토리 기록
      await AppointmentHistory.create({
        appointmentId: appointment._id,
        action: 'cancelled',
        previousStatus,
        newStatus: 'cancelled',
        reason,
        performedBy: userId
      });

      // 패널티 적용
      if (penaltyLevel !== 'NONE') {
        await User.findByIdAndUpdate(appointment.patientId, {
          $inc: { cancellationCount: 1 },
          $push: {
            penalties: {
              type: 'cancellation',
              level: penaltyLevel,
              appointmentId: appointment._id,
              appliedAt: now,
              expiresAt: new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30일 후 만료
            }
          }
        });
      }

      // 대기 신청에서 생성된 예약인 경우 대기 신청 상태도 업데이트
      if (appointment.createdFrom?.type === 'waitlist') {
        await Waitlist.findByIdAndUpdate(
          appointment.createdFrom.id,
          {
            status: 'pending',
            notes: `예약 취소: ${reason.detail}`
          }
        );
      }

      return {
        appointment,
        penaltyLevel,
        message: appointmentService.getPenaltyMessage(penaltyLevel)
      };
    } catch (error) {
      logger.error('Cancel appointment error:', error);
      throw error;
    }
  },

  getPenaltyMessage(level) {
    switch (level) {
      case 'HEAVY':
        return '24시간 이내 취소로 인해 30일간 예약이 제한됩니다.';
      case 'MEDIUM':
        return '48시간 이내 취소로 인해 경고가 부여됩니다.';
      case 'LIGHT':
        return '72시간 이내 취소입니다. 주의해 주세요.';
      default:
        return '패널티 없이 취소되었습니다.';
    }
  },

  // 의사의 일일 예약 현황 조회
  getDoctorDailySchedule: async (doctorId, date) => {
    try {
      const pipeline = appointmentAggregations.getDoctorDailySchedule(doctorId, date);
      const schedule = await Appointment.aggregate(pipeline);
      return schedule;
    } catch (error) {
      logger.error('Get doctor daily schedule error:', error);
      throw error;
    }
  },

  // 시간대별 예약 통계
  getHourlyStatistics: async (date = new Date()) => {
    try {
      // 날짜 문자열을 Date 객체로 변환
      const targetDate = moment(date).format('YYYY-MM-DD');
      const startOfDay = moment(targetDate).startOf('day');
      const endOfDay = moment(targetDate).endOf('day');

      logger.info('Query date range:', {
        targetDate,
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
      });

      // 먼저 해당 날짜의 모든 예약을 조회
      const appointments = await Appointment.find({
        appointmentDate: {
          $gte: startOfDay.toDate(),
          $lte: endOfDay.toDate()
        }
      });

      logger.info(`Found ${appointments.length} appointments`);

      // 시간대별로 그룹화
      const hourlyStats = {};
      appointments.forEach(appointment => {
        const hour = moment(appointment.appointmentDate).hour();
        if (!hourlyStats[hour]) {
          hourlyStats[hour] = {
            hour,
            count: 0,
            scheduled: 0,
            completed: 0,
            cancelled: 0
          };
        }
        
        hourlyStats[hour].count++;
        switch (appointment.status) {
          case 'scheduled':
            hourlyStats[hour].scheduled++;
            break;
          case 'completed':
            hourlyStats[hour].completed++;
            break;
          case 'cancelled':
            hourlyStats[hour].cancelled++;
            break;
        }
      });

      // 운영 시간대 (9시~18시)의 빈 시간대 포함
      const fullStatistics = Array.from({ length: 10 }, (_, i) => {
        const hour = i + 9;
        return hourlyStats[hour] || {
          hour,
          count: 0,
          scheduled: 0,
          completed: 0,
          cancelled: 0
        };
      });

      logger.info('Generated statistics:', fullStatistics);
      return fullStatistics;

    } catch (error) {
      logger.error('Error in getHourlyStatistics:', error);
      throw error;
    }
  },

  // 의사별 예약 통계 조회
  getDoctorStatistics: async (startDate, endDate) => {
    try {
      const pipeline = appointmentAggregations.getDoctorStatistics(startDate, endDate);
      const statistics = await Appointment.aggregate(pipeline);
      
      // 백분율 소수점 2자리로 포맷팅
      const formattedStats = statistics.map(stat => ({
        ...stat,
        completionRate: Math.round(stat.completionRate * 100) / 100
      }));

      return formattedStats;
    } catch (error) {
      logger.error('Get doctor statistics error:', error);
      throw error;
    }
  },

  // 예약 상세 조회
  getAppointmentDetail: async (appointmentId) => {
    try {
      // 예약 정보 조회
      const appointment = await Appointment.findOne({
        appointmentId,
        isActive: true
      })
        .select('appointmentId patientId doctorId scheduledAt duration status symptoms notes cancellation createdAt updatedAt')
        .lean();

      if (!appointment) {
        throw new Error('예약 정보를 찾을 수 없습니다.');
      }

      // 환자 정보 조회
      const patient = await Patient.findById(appointment.patientId)
        .select('name patientId birthDate gender phone email')
        .lean();

      // 의사 정보 조회
      const doctor = await User.findById(appointment.doctorId)
        .select('name department')
        .lean();

      // 응답 데이터 구조화
      return {
        id: appointment._id,
        appointmentId: appointment.appointmentId,
        patient: {
          id: patient._id,
          name: patient.name,
          patientNumber: patient.patientId,
          birthDate: moment(patient.birthDate).format('YYYY-MM-DD'),
          gender: patient.gender,
          phone: patient.phone,
          email: patient.email
        },
        doctor: {
          id: doctor._id,
          name: doctor.name,
          department: doctor.department
        },
        schedule: {
          date: moment(appointment.scheduledAt).format('YYYY-MM-DD'),
          time: moment(appointment.scheduledAt).format('HH:mm:ss'),
          duration: appointment.duration
        },
        status: appointment.status,
        symptoms: appointment.symptoms,
        notes: appointment.notes,
        cancellation: appointment.cancellation ? {
          reason: appointment.cancellation.reason,
          reasonCategory: appointment.cancellation.reasonCategory,
          cancelledAt: moment(appointment.cancellation.cancelledAt).format('YYYY-MM-DD HH:mm:ss')
        } : null,
        timestamps: {
          created: moment(appointment.createdAt).format('YYYY-MM-DD HH:mm:ss'),
          updated: moment(appointment.updatedAt).format('YYYY-MM-DD HH:mm:ss')
        }
      };
    } catch (error) {
      console.error('Get appointment detail error:', error);
      throw error;
    }
  },

  // 의사별 일일 예약 통계
  getDoctorDailyStatistics: async (doctorId, date = new Date()) => {
    const startOfDay = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();

    const statistics = await Appointment.aggregate([
      {
        $match: {
          doctorId: doctorId,
          appointmentDate: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          completedAppointments: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          cancelledAppointments: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
          },
          averageDuration: { $avg: "$duration" }
        }
      },
      {
        $project: {
          _id: 0,
          totalAppointments: 1,
          completedAppointments: 1,
          cancelledAppointments: 1,
          scheduledAppointments: {
            $subtract: [
              "$totalAppointments",
              { $add: ["$completedAppointments", "$cancelledAppointments"] }
            ]
          },
          averageDuration: { $round: ["$averageDuration", 1] }
        }
      }
    ]);

    return statistics[0] || {
      totalAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      scheduledAppointments: 0,
      averageDuration: 0
    };
  },

  // 의사별 일일 예약 통계
  async getDoctorDailyStats(doctorId, date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const stats = await Appointment.aggregate([
        {
          $match: {
            doctorId: new mongoose.Types.ObjectId(doctorId),
            startTime: {
              $gte: startOfDay,
              $lte: endOfDay
            }
          }
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            appointments: { 
              $push: {
                _id: "$_id",
                startTime: "$startTime",
                endTime: "$endTime",
                notes: "$notes"
              }
            }
          }
        },
        {
          $project: {
            status: "$_id",
            count: 1,
            appointments: 1,
            _id: 0
          }
        }
      ]);

      // 시간대별 예약 수 계산
      const hourlyStats = await Appointment.aggregate([
        {
          $match: {
            doctorId: new mongoose.Types.ObjectId(doctorId),
            startTime: {
              $gte: startOfDay,
              $lte: endOfDay
            }
          }
        },
        {
          $group: {
            _id: { $hour: "$startTime" },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { "_id": 1 }
        }
      ]);

      return {
        byStatus: stats,
        byHour: hourlyStats
      };
    } catch (error) {
      logger.error('Get doctor daily stats error:', error);
      throw error;
    }
  },

  // 예약 변경
  async updateAppointment(appointmentId, updateData, userId) {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('patientId', 'name email')
        .populate('doctorId', 'name email');

      if (!appointment) {
        throw new Error('예약을 찾을 수 없습니다.');
      }

      // 예약 시간 변경인 경우 중복 체크
      if (updateData.startTime && updateData.endTime) {
        const { isAvailable, conflictingAppointment } = await this.checkTimeSlotAvailability(
          appointment.doctorId,
          new Date(updateData.startTime),
          new Date(updateData.endTime)
        );

        if (!isAvailable) {
          throw new Error('선택한 시간에 이미 예약이 있습니다.');
        }
      }

      // 예약 정보 업데이트
      Object.assign(appointment, updateData);
      appointment.updatedAt = new Date();
      
      await appointment.save();

      return appointment;
    } catch (error) {
      logger.error('Update appointment error:', error);
      throw error;
    }
  },

  // 예약 재활성화
  async reactivateAppointment(appointmentId, newData) {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('patientId', 'name email')
        .populate('doctorId', 'name email');

      if (!appointment) {
        throw new Error('예약을 찾을 수 없습니다.');
      }

      if (appointment.status !== 'cancelled') {
        throw new Error('취소된 예약만 재활성화할 수 있습니다.');
      }

      // 새로운 시간대 중복 체크
      if (newData.startTime && newData.endTime) {
        const { isAvailable, conflictingAppointment } = await this.checkTimeSlotAvailability(
          appointment.doctorId,
          new Date(newData.startTime),
          new Date(newData.endTime)
        );

        if (!isAvailable) {
          throw new Error('선택한 시간에 이미 예약이 있습니다.');
        }
      }

      // 예약 정보 업데이트
      appointment.status = 'confirmed';
      appointment.startTime = newData.startTime || appointment.startTime;
      appointment.endTime = newData.endTime || appointment.endTime;
      appointment.notes = newData.notes || appointment.notes;
      appointment.updatedAt = new Date();
      
      await appointment.save();

      // 대기 신청 상태도 업데이트
      if (appointment.createdFrom?.type === 'waitlist') {
        await Waitlist.findByIdAndUpdate(
          appointment.createdFrom.id,
          {
            status: 'completed',
            notes: '예약 재활성화'
          }
        );
      }

      return appointment;
    } catch (error) {
      logger.error('Reactivate appointment error:', error);
      throw error;
    }
  }
};

module.exports = appointmentService; 