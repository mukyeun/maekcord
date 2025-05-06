const Appointment = require('../models/appointment');
const Waitlist = require('../models/waitlist');
const { startOfDay, endOfDay, startOfMonth, endOfMonth, format } = require('date-fns');
const { ko } = require('date-fns/locale');

class StatisticsService {
  // 일일 통계
  static async getDailyStats(date = new Date()) {
    const start = startOfDay(new Date(date));
    const end = endOfDay(new Date(date));

    const [appointments, waitlists] = await Promise.all([
      // 예약 통계
      Appointment.aggregate([
        {
          $match: {
            startTime: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      // 대기자 통계
      Waitlist.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgPriority: { $avg: '$priority' }
          }
        }
      ])
    ]);

    return {
      date: format(start, 'yyyy년 MM월 dd일', { locale: ko }),
      appointments: this._formatStatusCounts(appointments),
      waitlists: this._formatStatusCounts(waitlists, true)
    };
  }

  // 월간 통계
  static async getMonthlyStats(year, month) {
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    const [appointments, waitlists, dailyStats] = await Promise.all([
      // 월간 예약 총계
      Appointment.aggregate([
        {
          $match: {
            startTime: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      // 월간 대기자 총계
      Waitlist.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgPriority: { $avg: '$priority' }
          }
        }
      ]),
      // 일별 통계
      Appointment.aggregate([
        {
          $match: {
            startTime: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
              status: '$status'
            },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    return {
      period: format(start, 'yyyy년 MM월', { locale: ko }),
      monthly: {
        appointments: this._formatStatusCounts(appointments),
        waitlists: this._formatStatusCounts(waitlists, true)
      },
      daily: this._formatDailyStats(dailyStats)
    };
  }

  // 의사별 통계
  static async getDoctorStats(doctorId, startDate, endDate) {
    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    const [appointments, waitlists, timeSlotStats] = await Promise.all([
      // 예약 통계
      Appointment.aggregate([
        {
          $match: {
            doctorId: doctorId,
            startTime: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      // 대기자 통계
      Waitlist.aggregate([
        {
          $match: {
            doctorId: doctorId,
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgPriority: { $avg: '$priority' }
          }
        }
      ]),
      // 시간대별 선호도
      Appointment.aggregate([
        {
          $match: {
            doctorId: doctorId,
            startTime: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: { $hour: '$startTime' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ])
    ]);

    return {
      period: `${format(start, 'yyyy년 MM월 dd일', { locale: ko })} ~ ${format(end, 'yyyy년 MM월 dd일', { locale: ko })}`,
      appointments: this._formatStatusCounts(appointments),
      waitlists: this._formatStatusCounts(waitlists, true),
      timeSlotPreference: this._formatTimeSlotStats(timeSlotStats)
    };
  }

  // 헬퍼 메서드들
  static _formatStatusCounts(data, includeAvgPriority = false) {
    const formatted = {};
    data.forEach(item => {
      formatted[item._id] = includeAvgPriority
        ? { count: item.count, avgPriority: Number(item.avgPriority?.toFixed(1)) || 0 }
        : item.count;
    });
    return formatted;
  }

  static _formatDailyStats(data) {
    const formatted = {};
    data.forEach(item => {
      const { date, status } = item._id;
      if (!formatted[date]) {
        formatted[date] = {};
      }
      formatted[date][status] = item.count;
    });
    return formatted;
  }

  static _formatTimeSlotStats(data) {
    const formatted = {};
    data.forEach(item => {
      formatted[item._id] = item.count;
    });
    return formatted;
  }
}

module.exports = StatisticsService; 