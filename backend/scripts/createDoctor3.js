const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

const createDoctor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // 의사 계정 생성
    const doctor = await User.create({
      username: 'doctor3',
      password: 'doctor1234',  // 모델의 미들웨어에서 자동으로 해싱됨
      role: 'doctor',
      name: '박의사',
      email: 'doctor3@maekstation.com',
      phone: '010-3456-7890',
      department: '내과',
      specialization: '호흡기내과',
      licenseNumber: 'MD12347'
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