const mongoose = require('mongoose');
const moment = require('moment-timezone');
const Appointment = require('../models/appointment');
require('dotenv').config();

const generateAppointmentId = (date) => {
  const timestamp = moment(date).format('YYMMDDHHmmss');
  return `A${timestamp}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

const resetTestData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // 기존 데이터 삭제
    await Appointment.deleteMany({});
    console.log('Existing appointments deleted');

    // 새 테스트 데이터 생성
    const testDate = moment('2025-05-01').format('YYYY-MM-DD');
    const appointments = [
      {
        appointmentId: generateAppointmentId(moment(`${testDate} 09:00`)),
        patientId: 'P202504300001',
        doctorId: '6811d5ee703d2f5e751b83d8',
        appointmentDate: moment(`${testDate} 09:00`).toDate(),
        status: 'completed',
        duration: 25
      },
      {
        appointmentId: generateAppointmentId(moment(`${testDate} 09:30`)),
        patientId: 'P202504300002',
        doctorId: '6811d5ee703d2f5e751b83d8',
        appointmentDate: moment(`${testDate} 09:30`).toDate(),
        status: 'completed',
        duration: 35
      },
      {
        appointmentId: generateAppointmentId(moment(`${testDate} 10:00`)),
        patientId: 'P202504300003',
        doctorId: '6811d5ee703d2f5e751b83d8',
        appointmentDate: moment(`${testDate} 10:00`).toDate(),
        status: 'scheduled',
        duration: 30
      },
      {
        appointmentId: generateAppointmentId(moment(`${testDate} 11:00`)),
        patientId: 'P202504300004',
        doctorId: '6811d5ee703d2f5e751b83d8',
        appointmentDate: moment(`${testDate} 11:00`).toDate(),
        status: 'cancelled',
        duration: 30
      },
      {
        appointmentId: generateAppointmentId(moment(`${testDate} 14:30`)),
        patientId: 'P202504300005',
        doctorId: '6811d5ee703d2f5e751b83d8',
        appointmentDate: moment(`${testDate} 14:30`).toDate(),
        status: 'scheduled',
        duration: 30
      }
    ];

    await Appointment.insertMany(appointments);
    console.log('New test appointments created successfully');

  } catch (error) {
    console.error('Error resetting test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
};

resetTestData(); 