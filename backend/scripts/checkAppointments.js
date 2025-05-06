const mongoose = require('mongoose');
const moment = require('moment-timezone');
const Appointment = require('../models/appointment');
require('dotenv').config();

const checkAppointments = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    const testDate = moment('2025-05-01').format('YYYY-MM-DD');
    const startOfDay = moment(testDate).startOf('day').toDate();
    const endOfDay = moment(testDate).endOf('day').toDate();

    console.log('Checking appointments between:', {
      start: startOfDay,
      end: endOfDay
    });

    const appointments = await Appointment.find({
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    console.log('Found appointments:', appointments);
    console.log('Total count:', appointments.length);

  } catch (error) {
    console.error('Error checking appointments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
};

checkAppointments(); 