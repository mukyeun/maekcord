const mongoose = require('mongoose');

const appointmentAggregations = {
  // 의사별 일일 예약 현황 집계
  getDoctorDailySchedule: (doctorId, date) => [
    {
      $match: {
        doctorId: new mongoose.Types.ObjectId(doctorId),
        isActive: true,
        appointmentDate: {
          $gte: new Date(date),
          $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
        }
      }
    },
    {
      $lookup: {
        from: 'patients',
        localField: 'patientId',
        foreignField: 'patientId',
        as: 'patient'
      }
    },
    {
      $unwind: '$patient'
    },
    {
      $project: {
        appointmentId: 1,
        appointmentDate: 1,
        duration: 1,
        status: 1,
        type: 1,
        'patient.name': 1,
        'patient.patientId': 1,
        'patient.contact.phone': 1
      }
    },
    {
      $sort: { appointmentDate: 1 }
    }
  ],

  // 시간대별 예약 통계
  getHourlyStatistics: (startDate, endDate) => [
    {
      $match: {
        isActive: true,
        appointmentDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$appointmentDate' },
          date: { $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        '_id.date': 1,
        '_id.hour': 1
      }
    }
  ],

  // 의사별 예약 통계
  getDoctorStatistics: (startDate, endDate) => [
    {
      $match: {
        isActive: true,
        appointmentDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'doctorId',
        foreignField: '_id',
        as: 'doctor'
      }
    },
    {
      $unwind: '$doctor'
    },
    {
      $group: {
        _id: {
          doctorId: '$doctorId',
          doctorName: '$doctor.name'
        },
        totalAppointments: { $sum: 1 },
        completedAppointments: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        },
        cancelledAppointments: {
          $sum: {
            $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        doctorName: '$_id.doctorName',
        totalAppointments: 1,
        completedAppointments: 1,
        cancelledAppointments: 1,
        completionRate: {
          $multiply: [
            { $divide: ['$completedAppointments', '$totalAppointments'] },
            100
          ]
        }
      }
    },
    {
      $sort: { totalAppointments: -1 }
    }
  ]
};

module.exports = appointmentAggregations; 