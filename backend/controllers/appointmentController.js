const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const moment = require('moment-timezone');
const { USER_ROLES, APPOINTMENT_STATUS, CANCELLATION_REASONS } = require('../config/constants');
const { validateDate } = require('../utils/validators');
const appointmentService = require('../services/appointmentService');
const { formatAppointment } = require('../utils/responseFormatter');
const logger = require('../config/logger');
const notificationService = require('../services/notificationService');
const Waitlist = require('../models/Waitlist');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/errors');
const AppointmentService = require('../services/appointmentService');
const appointmentConfig = require('../config/appointmentConfig');
moment.tz.setDefault('Asia/Seoul');

// 모든 컨트롤러 함수들을 객체로 정의
const appointmentController = {
  // 예약 목록 조회
  getAppointments: async (req, res, next) => {
    try {
      const { 
        page = 1, 
        limit = 10,
        status,
        date,
        patientId,
        sortBy = 'dateTime',
        order = 'asc'
      } = req.query;

      const query = {};
      
      if (status) {
        query.status = status;
      }

      if (date) {
        const startDate = moment(date).startOf('day');
        const endDate = moment(date).endOf('day');
        query.dateTime = {
          $gte: startDate.toDate(),
          $lte: endDate.toDate()
        };
      }

      if (patientId) {
        query.patientId = patientId;
      }

      const [appointments, total] = await Promise.all([
        Appointment.find(query)
          .populate('patientId', 'name patientId')
          .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit)),
        Appointment.countDocuments(query)
      ]);

      logger.info(`Retrieved ${appointments.length} appointments`);

      res.json({
        success: true,
        message: `${total}건의 예약이 조회되었습니다.`,
        data: {
          appointments,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Appointment retrieval failed:', error);
      next(error);
    }
  },

  // 예약 생성
  createAppointment: async (req, res, next) => {
    try {
      const { patientId, dateTime, duration, type, notes } = req.body;

      // 환자 존재 여부 확인
      const patient = await Patient.findById(patientId);
      if (!patient) {
        throw new NotFoundError('환자를 찾을 수 없습니다.');
      }

      // 예약 시간 중복 체크
      const appointmentDate = moment(dateTime);
      const existingAppointment = await Appointment.findOne({
        dateTime: {
          $gte: appointmentDate.toDate(),
          $lt: appointmentDate.add(duration || 30, 'minutes').toDate()
        },
        status: 'scheduled'
      });

      if (existingAppointment) {
        throw new ValidationError('해당 시간에 이미 예약이 있습니다.');
      }

      const appointment = new Appointment({
        patientId,
        dateTime,
        duration: duration || 30,
        type,
        notes,
        createdBy: req.user.id
      });

      await appointment.save();
      
      // 환자 기록에 예약 활동 추가
      patient.addActivityLog('appointment_created', 
        `예약 생성: ${moment(dateTime).format('YYYY-MM-DD HH:mm')}`, 
        req.user.id
      );
      await patient.save();

      logger.info(`New appointment created: ${appointment._id} for patient: ${patientId}`);

      res.status(201).json({
        success: true,
        message: '예약이 생성되었습니다.',
        data: appointment
      });
    } catch (error) {
      logger.error('Appointment creation failed:', error);
      next(error);
    }
  },

  // 예약 취소
  cancelAppointment: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason, detail } = req.body;

      if (!reason || !Object.values(appointmentConfig.CANCELLATION_REASONS).includes(reason)) {
        throw new ValidationError('유효한 취소 사유를 선택해주세요.');
      }

      const result = await AppointmentService.cancelAppointment(id, req.user.id, {
        code: reason,
        detail: detail || ''
      });

      res.json({
        success: true,
        message: '예약이 취소되었습니다.',
        data: {
          appointment: result.appointment,
          penaltyMessage: result.message
        }
      });

    } catch (error) {
      next(error);
    }
  },

  // 예약 상태 업데이트
  updateAppointmentStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      // 상태값 검증
      const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "유효하지 않은 상태값입니다."
        });
      }

      const appointment = await Appointment.findById(id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "예약을 찾을 수 없습니다."
        });
      }

      // 권한 확인
      if (req.user.role === 'doctor' && appointment.doctorId.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: "다른 의사의 예약은 수정할 수 없습니다."
        });
      }

      // 환자는 취소만 가능
      if (req.user.role === 'patient') {
        if (status !== 'cancelled' || appointment.patientId.toString() !== req.user.userId) {
          return res.status(403).json({
            success: false,
            message: "환자는 자신의 예약만 취소할 수 있습니다."
          });
        }
      }

      // 이미 완료된 예약은 수정 불가
      if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
        return res.status(400).json({
          success: false,
          message: "이미 완료/취소된 예약은 수정할 수 없습니다."
        });
      }

      // 상태 업데이트
      appointment.status = status;
      if (reason) {
        appointment.notes = appointment.notes 
          ? `${appointment.notes}\n상태 변경 (${status}): ${reason}`
          : `상태 변경 (${status}): ${reason}`;
      }

      await appointment.save();

      res.json({
        success: true,
        data: appointment,
        message: "예약 상태가 업데이트되었습니다."
      });
    } catch (error) {
      logger.error('Error in updateAppointmentStatus:', error);
      res.status(500).json({
        success: false,
        message: "예약 상태 업데이트 중 오류가 발생했습니다."
      });
    }
  },

  // 의사별 예약 목록 조회
  getDoctorAppointments: async (req, res) => {
    try {
      const { doctorId } = req.params;
      const { date, status } = req.query;

      const query = { doctorId };

      if (date) {
        const startDate = moment(date).startOf('day').toDate();
        const endDate = moment(date).endOf('day').toDate();
        query.appointmentDate = { $gte: startDate, $lte: endDate };
      }

      if (status) {
        query.status = status;
      }

      const appointments = await Appointment.find(query)
        .sort({ appointmentDate: 1 })
        .populate('patientId', 'name patientId');

      res.json({
        success: true,
        data: appointments
      });
    } catch (error) {
      logger.error('Get doctor appointments error:', error);
      res.status(500).json({
        success: false,
        message: '예약 목록 조회 중 오류가 발생했습니다.'
      });
    }
  },

  // 시간대별 통계
  getHourlyStatistics: async (req, res) => {
    try {
      const { date } = req.query;
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      const appointments = await Appointment.find({
        appointmentDate: { $gte: startDate, $lt: endDate }
      });

      // 시간대별 통계 초기화 (9시~18시)
      const statistics = Array.from({ length: 10 }, (_, i) => ({
        hour: i + 9,
        count: 0,
        scheduled: 0,
        completed: 0,
        cancelled: 0
      }));

      // 예약 데이터 집계
      appointments.forEach(appointment => {
        const hour = appointment.appointmentDate.getHours();
        const hourIndex = hour - 9;
        
        if (hourIndex >= 0 && hourIndex < statistics.length) {
          statistics[hourIndex].count++;
          statistics[hourIndex][appointment.status]++;
        }
      });

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('Get hourly statistics error:', error);
      res.status(500).json({
        success: false,
        message: '시간대별 통계 조회 중 오류가 발생했습니다.'
      });
    }
  },

  // 의사별 일일 통계
  getDoctorDailyStatistics: async (req, res) => {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      const appointments = await Appointment.find({
        doctorId,
        appointmentDate: { $gte: startDate, $lt: endDate }
      });

      const statistics = {
        doctorId,
        date,
        totalAppointments: appointments.length,
        completedAppointments: appointments.filter(a => a.status === 'completed').length,
        cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length,
        scheduledAppointments: appointments.filter(a => a.status === 'scheduled').length,
        averageDuration: appointments.length > 0 ? 
          appointments.reduce((sum, a) => sum + (a.duration || 30), 0) / appointments.length : 
          null
      };

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('Get doctor daily statistics error:', error);
      res.status(500).json({
        success: false,
        message: '의사별 일일 통계 조회 중 오류가 발생했습니다.'
      });
    }
  },

  // 예약 통계
  getAppointmentStats: async (req, res) => {
    try {
      const { startDate, endDate, doctorId } = req.query;
      let query = {};

      // 날짜 범위 설정
      if (startDate && endDate) {
        query.appointmentDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // 특정 의사의 통계만 조회
      if (doctorId) {
        try {
          query.doctorId = new mongoose.Types.ObjectId(doctorId);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: '유효하지 않은 의사 ID입니다.'
          });
        }
      }

      // 기본 파이프라인
      const matchStage = { $match: query };

      // 상태별 예약 수
      const statusStats = await Appointment.aggregate([
        matchStage,
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // 시간대별 예약 분포
      const hourlyDistribution = await Appointment.aggregate([
        matchStage,
        {
          $group: {
            _id: { $hour: '$appointmentDate' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      // 요일별 예약 분포
      const dailyDistribution = await Appointment.aggregate([
        matchStage,
        {
          $group: {
            _id: { $dayOfWeek: '$appointmentDate' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      // 의사별 통계 (doctorId가 지정되지 않은 경우만)
      let doctorStats = [];
      if (!doctorId) {
        doctorStats = await Appointment.aggregate([
          matchStage,
          {
            $group: {
              _id: '$doctorId',
              totalAppointments: { $sum: 1 },
              completedAppointments: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              cancelledAppointments: {
                $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
              }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'doctor'
            }
          },
          {
            $project: {
              doctor: { $arrayElemAt: ['$doctor.name', 0] },
              totalAppointments: 1,
              completedAppointments: 1,
              cancelledAppointments: 1,
              cancellationRate: {
                $multiply: [
                  { 
                    $cond: [
                      { $eq: ['$totalAppointments', 0] },
                      0,
                      { $divide: ['$cancelledAppointments', '$totalAppointments'] }
                    ]
                  },
                  100
                ]
              }
            }
          }
        ]);
      }

      // 전체 예약 수는 마지막에 계산
      const totalAppointments = await Appointment.countDocuments(query);

      res.json({
        success: true,
        data: {
          totalAppointments,
          statusStats: statusStats.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {}),
          hourlyDistribution: hourlyDistribution.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {}),
          dailyDistribution: dailyDistribution.reduce((acc, curr) => {
            const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
            acc[dayNames[curr._id - 1]] = curr.count;
            return acc;
          }, {}),
          doctorStats
        }
      });
    } catch (error) {
      logger.error('Get appointment stats error:', error);
      res.status(500).json({
        success: false,
        message: '예약 통계 조회 중 오류가 발생했습니다.'
      });
    }
  },

  // 예약 상세 조회
  getAppointmentDetail: async (req, res) => {
    try {
      const { appointmentId } = req.params;

      const appointment = await Appointment.findOne({ appointmentId })
        .populate('patientId', 'name patientId')
        .populate('doctorId', 'name');

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: '예약을 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: appointment
      });
    } catch (error) {
      logger.error('Get appointment detail error:', error);
      res.status(500).json({
        success: false,
        message: '예약 상세 조회 중 오류가 발생했습니다.'
      });
    }
  },

  // 예약 수정
  updateAppointment: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        throw new NotFoundError('예약을 찾을 수 없습니다.');
      }

      // 이미 완료된 예약은 수정 불가
      if (appointment.status === 'completed') {
        throw new ValidationError('완료된 예약은 수정할 수 없습니다.');
      }

      // 시간 변경 시 중복 체크
      if (updateData.dateTime && updateData.dateTime !== appointment.dateTime.toISOString()) {
        const newDateTime = moment(updateData.dateTime);
        const existingAppointment = await Appointment.findOne({
          _id: { $ne: id },
          dateTime: {
            $gte: newDateTime.toDate(),
            $lt: newDateTime.add(updateData.duration || appointment.duration, 'minutes').toDate()
          },
          status: 'scheduled'
        });

        if (existingAppointment) {
          throw new ValidationError('해당 시간에 이미 다른 예약이 있습니다.');
        }
      }

      // 수정된 필드들 추적
      const modifiedFields = Object.keys(updateData)
        .filter(key => updateData[key] !== appointment[key])
        .join(', ');

      Object.assign(appointment, updateData);
      appointment.updatedBy = req.user.id;
      await appointment.save();

      // 환자 기록에 예약 수정 활동 추가
      const patient = await Patient.findById(appointment.patientId);
      if (patient) {
        patient.addActivityLog('appointment_updated', 
          `예약 수정: ${modifiedFields}`, 
          req.user.id
        );
        await patient.save();
      }

      logger.info(`Appointment updated: ${id}, Modified fields: ${modifiedFields}`);

      res.json({
        success: true,
        message: '예약이 수정되었습니다.',
        data: appointment
      });
    } catch (error) {
      logger.error('Appointment update failed:', error);
      next(error);
    }
  },

  // 예약 삭제 (추가)
  deleteAppointment: async (req, res) => {
    try {
      await Appointment.findByIdAndDelete(req.params.id);
      res.json({
        success: true,
        message: "예약이 삭제되었습니다."
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // 대기 신청에서 예약 생성
  createFromWaitlist: async (req, res) => {
    try {
      logger.info('createFromWaitlist called');
      const { waitlistId } = req.params;
      const { startTime, endTime, notes } = req.body;
      const doctorId = req.user.userId;

      // 시간 중복 체크
      const { isAvailable, conflictingAppointment } = await appointmentService.checkTimeSlotAvailability(
        doctorId,
        new Date(startTime),
        new Date(endTime)
      );

      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: "선택한 시간에 이미 예약이 있습니다.",
          conflictingAppointment
        });
      }

      // 대기 신청 정보 조회
      const waitlist = await Waitlist.findById(waitlistId);
      if (!waitlist) {
        logger.warn(`Waitlist not found: ${waitlistId}`);
        return res.status(404).json({
          success: false,
          message: "대기 신청을 찾을 수 없습니다."
        });
      }

      // 예약 생성
      const appointment = await appointmentService.createAppointment({
        patientId: waitlist.patientId,
        doctorId: doctorId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        notes,
        status: 'confirmed',
        createdFrom: {
          type: 'waitlist',
          id: waitlist._id
        }
      });

      // 대기 상태 업데이트
      const updatedWaitlist = await Waitlist.findByIdAndUpdate(
        waitlistId,
        {
          status: 'completed',
          notes: `예약 완료: ${appointment._id}`
        },
        { new: true }
      );

      // 예약 생성 알림 발송
      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('patientId', 'name email')
        .populate('doctorId', 'name email');
      
      await notificationService.sendAppointmentCreatedNotification(populatedAppointment);

      res.status(201).json({
        success: true,
        data: {
          appointment: populatedAppointment,
          waitlist: updatedWaitlist
        },
        message: "예약이 생성되었습니다."
      });

    } catch (error) {
      logger.error('Error in createFromWaitlist:', error);
      res.status(500).json({
        success: false,
        message: "예약 생성 중 오류가 발생했습니다.",
        error: error.message
      });
    }
  },

  // 단일 예약 조회
  getAppointment: async (req, res, next) => {
    try {
      const { id } = req.params;
      const appointment = await Appointment.findById(id)
        .populate('patientId', 'name patientId contact');

      if (!appointment) {
        throw new NotFoundError('예약을 찾을 수 없습니다.');
      }

      logger.info(`Retrieved appointment details: ${id}`);

      res.json({
        success: true,
        data: appointment
      });
    } catch (error) {
      logger.error('Appointment detail retrieval failed:', error);
      next(error);
    }
  },

  // 의사별 일일 예약 통계 조회
  getDoctorDailyStats: async (req, res) => {
    try {
      const { date } = req.query;
      const stats = await Appointment.aggregate([
        {
          $match: {
            doctorId: req.user.userId,
            startTime: {
              $gte: new Date(date),
              $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
            }
          }
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: stats,
        message: "일일 통계 조회 성공"
      });
    } catch (error) {
      logger.error('Error in getDoctorDailyStats:', error);
      res.status(500).json({
        success: false,
        message: "일일 통계 조회 중 오류가 발생했습니다."
      });
    }
  },

  // 예약 재활성화
  reactivateAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const newData = req.body;
      const userId = req.user.userId;

      // 예약 조회 및 권한 확인
      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "예약을 찾을 수 없습니다."
        });
      }

      // 의사 본인의 예약이거나 관리자만 재활성화 가능
      if (appointment.doctorId.toString() !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: "예약을 재활성화할 권한이 없습니다."
        });
      }

      const reactivatedAppointment = await appointmentService.reactivateAppointment(id, newData);

      // 재활성화 알림 발송
      await notificationService.sendAppointmentReactivatedNotification(reactivatedAppointment);

      res.json({
        success: true,
        data: reactivatedAppointment,
        message: "예약이 재활성화되었습니다."
      });

    } catch (error) {
      logger.error('Error in reactivateAppointment:', error);
      res.status(500).json({
        success: false,
        message: "예약 재활성화 중 오류가 발생했습니다.",
        error: error.message
      });
    }
  },

  // 월간 통계
  getDoctorMonthlyStats: async (req, res) => {
    try {
      const { year, month } = req.query;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const stats = await Appointment.aggregate([
        {
          $match: {
            doctorId: req.user.userId,
            startTime: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: {
              day: { $dayOfMonth: "$startTime" },
              status: "$status"
            },
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: stats,
        message: "월간 통계 조회 성공"
      });
    } catch (error) {
      logger.error('Error in getDoctorMonthlyStats:', error);
      res.status(500).json({
        success: false,
        message: "월간 통계 조회 중 오류가 발생했습니다."
      });
    }
  }
};

// 컨트롤러 객체를 그대로 내보내기
module.exports = appointmentController;