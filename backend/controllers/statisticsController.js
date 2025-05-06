const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Waitlist = require('../models/Waitlist');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

const statisticsController = {
  // 일일 통계
  getDailyStats: async (req, res, next) => {
    try {
      const { date = moment().format('YYYY-MM-DD') } = req.query;
      const startDate = moment(date).startOf('day');
      const endDate = moment(date).endOf('day');

      // 당일 예약 통계
      const appointmentStats = await Appointment.aggregate([
        {
          $match: {
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

      // 당일 대기 통계
      const waitlistStats = await Waitlist.aggregate([
        {
          $match: {
            date: startDate.toDate()
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgWaitTime: {
              $avg: {
                $cond: [
                  { $eq: ['$status', 'completed'] },
                  { 
                    $divide: [
                      { $subtract: ['$completedAt', '$registeredAt'] },
                      60000  // 밀리초를 분으로 변환
                    ]
                  },
                  null
                ]
              }
            }
          }
        }
      ]);

      // 신규 환자 수
      const newPatients = await Patient.countDocuments({
        createdAt: {
          $gte: startDate.toDate(),
          $lte: endDate.toDate()
        }
      });

      // 시간대별 방문 통계
      const hourlyStats = await Appointment.aggregate([
        {
          $match: {
            dateTime: {
              $gte: startDate.toDate(),
              $lte: endDate.toDate()
            },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: { $hour: '$dateTime' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      // 통계 데이터 정리
      const stats = {
        date: date,
        appointments: {
          total: appointmentStats.reduce((sum, stat) => sum + stat.count, 0),
          completed: appointmentStats.find(s => s._id === 'completed')?.count || 0,
          cancelled: appointmentStats.find(s => s._id === 'cancelled')?.count || 0,
          noShow: appointmentStats.find(s => s._id === 'no_show')?.count || 0
        },
        waitlist: {
          total: waitlistStats.reduce((sum, stat) => sum + stat.count, 0),
          completed: waitlistStats.find(s => s._id === 'completed')?.count || 0,
          cancelled: waitlistStats.find(s => s._id === 'cancelled')?.count || 0,
          averageWaitTime: Math.round(waitlistStats.find(s => s._id === 'completed')?.avgWaitTime || 0)
        },
        patients: {
          new: newPatients
        },
        hourlyVisits: hourlyStats.map(stat => ({
          hour: stat._id,
          count: stat.count
        }))
      };

      logger.info(`Daily statistics retrieved for ${date}`);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Daily statistics retrieval failed:', error);
      next(error);
    }
  },

  // 월간 통계
  getMonthlyStats: async (req, res, next) => {
    try {
      const { year, month } = req.query;
      
      if (!year || !month) {
        throw new ValidationError('연도와 월을 지정해주세요.');
      }

      const startDate = moment(`${year}-${month}-01`).startOf('month');
      const endDate = moment(startDate).endOf('month');

      // 월간 예약 통계
      const appointmentStats = await Appointment.aggregate([
        {
          $match: {
            dateTime: {
              $gte: startDate.toDate(),
              $lte: endDate.toDate()
            }
          }
        },
        {
          $group: {
            _id: {
              status: '$status',
              day: { $dayOfMonth: '$dateTime' }
            },
            count: { $sum: 1 }
          }
        }
      ]);

      // 월간 신규 환자 통계
      const patientStats = await Patient.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate.toDate(),
              $lte: endDate.toDate()
            }
          }
        },
        {
          $group: {
            _id: { $dayOfMonth: '$createdAt' },
            count: { $sum: 1 }
          }
        }
      ]);

      // 일별 통계 데이터 생성
      const daysInMonth = endDate.date();
      const dailyStats = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const appointments = appointmentStats
          .filter(stat => stat._id.day === day)
          .reduce((acc, stat) => {
            acc[stat._id.status] = stat.count;
            return acc;
          }, {});

        return {
          day,
          appointments: {
            total: Object.values(appointments).reduce((sum, count) => sum + count, 0),
            completed: appointments.completed || 0,
            cancelled: appointments.cancelled || 0,
            noShow: appointments.no_show || 0
          },
          newPatients: patientStats.find(stat => stat._id === day)?.count || 0
        };
      });

      // 월간 합계 계산
      const monthlyTotals = dailyStats.reduce((totals, day) => {
        totals.appointments.total += day.appointments.total;
        totals.appointments.completed += day.appointments.completed;
        totals.appointments.cancelled += day.appointments.cancelled;
        totals.appointments.noShow += day.appointments.noShow;
        totals.newPatients += day.newPatients;
        return totals;
      }, {
        appointments: {
          total: 0,
          completed: 0,
          cancelled: 0,
          noShow: 0
        },
        newPatients: 0
      });

      logger.info(`Monthly statistics retrieved for ${year}-${month}`);

      res.json({
        success: true,
        data: {
          year: parseInt(year),
          month: parseInt(month),
          dailyStats,
          totals: monthlyTotals
        }
      });
    } catch (error) {
      logger.error('Monthly statistics retrieval failed:', error);
      next(error);
    }
  },

  // 의사별 통계
  getDoctorStats: async (req, res, next) => {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new ValidationError('조회 기간을 지정해주세요.');
      }

      const stats = await StatisticsService.getDoctorStats(
        doctorId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        message: '의사별 통계 조회 성공',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = statisticsController; 