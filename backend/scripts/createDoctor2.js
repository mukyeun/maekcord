const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
require('dotenv').config();

const createDoctor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // 의사 계정 생성
    const doctor = await User.create({
      username: 'doctor2',
      password: await bcrypt.hash('doctor1234', 10),
      role: 'doctor',
      name: '이의사',
      email: 'doctor2@maekstation.com',
      phone: '010-2345-6789',
      department: '내과',
      specialization: '소화기내과',
      licenseNumber: 'MD12346'
    });

    console.log('Doctor account created successfully:', {
      id: doctor._id,
      username: doctor.username,
      role: doctor.role,
      name: doctor.name
    });

  } catch (error) {
    console.error('Error creating doctor account:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
};

createDoctor(); 