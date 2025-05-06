const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
require('dotenv').config();

const createDoctor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // 기존 의사 확인
    const existingDoctor = await User.findOne({ username: 'doctor1' });
    if (existingDoctor) {
      console.log('Doctor account already exists');
      await mongoose.disconnect();
      return;
    }

    // 의사 계정 생성
    const doctor = await User.create({
      username: 'doctor1',
      password: await bcrypt.hash('doctor1234', 10),
      role: 'doctor',
      name: '김의사',
      email: 'doctor1@maekstation.com',
      phone: '010-1234-5678',
      department: '내과',
      specialization: '일반내과',
      licenseNumber: 'MD12345'
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