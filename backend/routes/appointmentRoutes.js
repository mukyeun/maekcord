const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const validateRequest = require('../middlewares/validateRequest');
const appointmentValidation = require('../validations/appointmentValidation');
const { authMiddleware } = require('../middlewares/auth');
const { USER_ROLES } = require('../constants');
const { validateAppointment } = require('../middlewares/validators');
const { AppError } = require('../middleware/errorHandler');
const auth = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const logger = require('../utils/logger');
const { authenticateToken } = require('../middlewares/auth');
const moment = require('moment');
const mongoose = require('mongoose');
const { ValidationError } = require('../middleware/errorHandler');

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: 예약 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required:
 *         - patientId
 *         - dateTime
 *         - type
 *       properties:
 *         patientId:
 *           type: string
 *           description: 환자 ID
 *         dateTime:
 *           type: string
 *           format: date-time
 *           description: 예약 일시
 *         duration:
 *           type: number
 *           description: 예약 시간 (분)
 *           default: 30
 *         type:
 *           type: string
 *           enum: [initial, follow_up, consultation, treatment, test]
 *           description: 예약 유형
 *         status:
 *           type: string
 *           enum: [scheduled, completed, cancelled, no_show]
 *           default: scheduled
 *           description: 예약 상태
 *         notes:
 *           type: string
 *           description: 메모
 */

// 미들웨어 등록 - 모든 라우트에 인증 적용
router.use(authMiddleware);

// 통계 관련 라우트
router.get('/stats/daily', async (req, res, next) => {
  try {
    const { date } = req.query;
    const doctorId = req.user.id;

    if (!date) {
      throw new ValidationError('날짜를 지정해주세요.');
    }

    const startDate = moment(date).startOf('day');
    const endDate = moment(date).endOf('day');

    const stats = await Appointment.aggregate([
      {
        $match: {
          doctorId: new mongoose.Types.ObjectId(doctorId),
          dateTime: {
            $gte: startDate.toDate(),
            $lte: endDate.toDate()
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      total: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats/monthly', async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const doctorId = req.user.id;

    if (!year || !month) {
      throw new ValidationError('년도와 월을 지정해주세요.');
    }

    const startDate = moment(`${year}-${month}-01`).startOf('month');
    const endDate = moment(startDate).endOf('month');

    const stats = await Appointment.aggregate([
      {
        $match: {
          doctorId: new mongoose.Types.ObjectId(doctorId),
          dateTime: {
            $gte: startDate.toDate(),
            $lte: endDate.toDate()
          }
        }
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: '$dateTime' },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.day': 1
        }
      }
    ]);

    const formattedStats = {};
    for (let day = 1; day <= endDate.date(); day++) {
      formattedStats[day] = {
        total: 0,
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0
      };
    }

    stats.forEach(stat => {
      const { day, status } = stat._id;
      formattedStats[day][status] = stat.count;
      formattedStats[day].total += stat.count;
    });

    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    next(error);
  }
});

// 의사/환자별 예약 목록
router.get('/doctor/:doctorId', async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      throw new ValidationError('날짜를 지정해주세요.');
    }

    const startDate = moment(date).startOf('day');
    const endDate = moment(date).endOf('day');

    const appointments = await Appointment.find({
      doctorId,
      dateTime: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate()
      }
    })
    .populate('patientId', 'name dateOfBirth gender')
    .sort({ dateTime: 1 });

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
});

router.get('/patient/:patientId', async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'name department')
      .sort({ dateTime: -1 });

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
});

// 기본 CRUD 라우트
router.get('/', async (req, res, next) => {
  try {
    const { date, status } = req.query;
    const query = {};
    
    if (date) {
      const startDate = moment(date).startOf('day');
      const endDate = moment(date).endOf('day');
      query.dateTime = {
        $gte: startDate.toDate(),
        $lte: endDate.toDate()
      };
    }
    
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name')
      .populate('doctorId', 'name department')
      .sort({ dateTime: 1 });

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const appointmentData = {
      patientId: req.body.patientId,
      doctorId: req.body.doctorId,
      dateTime: req.body.dateTime,
      duration: req.body.duration || 30,
      type: req.body.type,
      notes: req.body.notes,
      createdBy: req.user.id
    };

    const appointment = new Appointment(appointmentData);
    await appointment.save();

    logger.info(`✅ 새로운 예약 생성됨 (ID: ${appointment._id})`);

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name dateOfBirth gender')
      .populate('doctorId', 'name department')
      .populate('createdBy', 'name');

    if (!appointment) {
      throw new ValidationError('예약을 찾을 수 없습니다.');
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = Object.keys(req.body);
    const allowedUpdates = ['dateTime', 'duration', 'type', 'notes', 'status'];
    
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
      throw new ValidationError('잘못된 업데이트 요청입니다.');
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      throw new ValidationError('예약을 찾을 수 없습니다.');
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      throw new ValidationError('완료되거나 취소된 예약은 수정할 수 없습니다.');
    }

    updates.forEach(update => appointment[update] = req.body[update]);
    appointment.updatedBy = req.user.id;
    await appointment.save();

    logger.info(`✅ 예약 수정됨 (ID: ${id})`);

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      throw new ValidationError('예약을 찾을 수 없습니다.');
    }

    if (appointment.status !== 'scheduled') {
      throw new ValidationError('예약된 상태의 예약만 취소할 수 있습니다.');
    }

    appointment.status = 'cancelled';
    appointment.updatedBy = req.user.id;
    await appointment.save();

    logger.info(`✅ 예약 취소됨 (ID: ${req.params.id})`);

    res.json({
      success: true,
      message: '예약이 취소되었습니다.'
    });
  } catch (error) {
    next(error);
  }
});

// 예약 가능 시간 확인 API
router.get('/available-slots', async (req, res, next) => {
  try {
    const { date, doctorId } = req.query;
    
    if (!date || !doctorId) {
      throw new ValidationError('날짜와 의사 ID가 필요합니다.');
    }

    const startDate = moment(date).startOf('day');
    const endDate = moment(date).endOf('day');

    // 해당 날짜의 모든 예약 조회
    const appointments = await Appointment.find({
      doctorId,
      dateTime: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate()
      },
      status: { $ne: 'cancelled' }
    }).sort({ dateTime: 1 });

    // 진료 시간 설정 (8:00 ~ 19:00)
    const CLINIC_START = 8;
    const CLINIC_END = 19;
    const LUNCH_START = 12;
    const LUNCH_END = 13;
    const SLOT_DURATION = 15; // 15분 단위

    // 가능한 시간대 계산
    const availableSlots = [];
    let currentTime = moment(startDate).hour(CLINIC_START).minute(0);
    const dayEnd = moment(startDate).hour(CLINIC_END).minute(0);

    while (currentTime.isBefore(dayEnd)) {
      const hour = currentTime.hour();
      
      // 점심시간 제외
      if (hour >= LUNCH_START && hour < LUNCH_END) {
        currentTime.add(SLOT_DURATION, 'minutes');
        continue;
      }

      // 해당 시간대에 예약이 있는지 확인
      const slotEnd = moment(currentTime).add(SLOT_DURATION, 'minutes');
      const hasOverlap = appointments.some(apt => {
        const aptStart = moment(apt.dateTime);
        const aptEnd = moment(apt.dateTime).add(apt.duration || 30, 'minutes');
        return (
          (currentTime.isSameOrAfter(aptStart) && currentTime.isBefore(aptEnd)) ||
          (slotEnd.isAfter(aptStart) && slotEnd.isSameOrBefore(aptEnd))
        );
      });

      if (!hasOverlap) {
        availableSlots.push({
          startTime: currentTime.format('HH:mm'),
          endTime: slotEnd.format('HH:mm'),
          datetime: currentTime.toISOString()
        });
      }

      currentTime.add(SLOT_DURATION, 'minutes');
    }

    res.json({
      success: true,
      data: availableSlots
    });
  } catch (error) {
    next(error);
  }
});

// 예약 시간 중복 체크 API
router.post('/check-overlap', async (req, res, next) => {
  try {
    const { doctorId, dateTime, duration = 30 } = req.body;
    
    if (!doctorId || !dateTime) {
      throw new ValidationError('의사 ID와 예약 시간이 필요합니다.');
    }

    const appointmentStart = moment(dateTime);
    const appointmentEnd = moment(dateTime).add(duration, 'minutes');

    // 점심시간 체크 (12:00 ~ 13:00)
    const hour = appointmentStart.hour();
    if (hour === 12 || (hour === 11 && appointmentEnd.hour() >= 12)) {
      return res.json({
        success: false,
        message: '점심시간에는 예약할 수 없습니다.',
        isOverlap: true,
        reason: 'lunch'
      });
    }

    // 진료시간 체크 (8:00 ~ 19:00)
    if (hour < 8 || hour >= 19 || appointmentEnd.hour() >= 19) {
      return res.json({
        success: false,
        message: '진료시간이 아닙니다.',
        isOverlap: true,
        reason: 'clinic_hours'
      });
    }

    // 중복 예약 체크
    const overlappingAppointment = await Appointment.findOne({
      doctorId,
      status: { $ne: 'cancelled' },
      $or: [
        {
          dateTime: {
            $lt: appointmentEnd.toDate(),
            $gte: appointmentStart.toDate()
          }
        },
        {
          $expr: {
            $and: [
              { $lt: ['$dateTime', appointmentEnd.toDate()] },
              {
                $gte: [
                  { $add: ['$dateTime', { $multiply: ['$duration', 60000] }] },
                  appointmentStart.toDate()
                ]
              }
            ]
          }
        }
      ]
    });

    if (overlappingAppointment) {
      return res.json({
        success: false,
        message: '해당 시간에 이미 예약이 있습니다.',
        isOverlap: true,
        reason: 'overlap',
        existingAppointment: overlappingAppointment
      });
    }

    res.json({
      success: true,
      message: '예약 가능한 시간입니다.',
      isOverlap: false
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;