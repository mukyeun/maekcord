const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createTestUser = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maekcord';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected');

    // 기존 테스트 사용자 확인
    const existingUser = await User.findOne({ email: 'admin@test.com' });
    if (existingUser) {
      console.log('Test user already exists');
      console.log('Email:', existingUser.email);
      console.log('Name:', existingUser.name);
      console.log('Role:', existingUser.role);
      return;
    }

    // 테스트 사용자 생성
    const testUser = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: '123456',
      name: '관리자',
      role: 'admin',
      phone: '010-0000-0000'
    });

    console.log('Test user created successfully:', {
      email: testUser.email,
      name: testUser.name,
      role: testUser.role
    });

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
};

createTestUser(); 