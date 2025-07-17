const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createOrUpdateTestUser = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maekcord';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected');

    // 테스트 계정 정보
    const testUserData = {
      username: 'admin',
      email: 'admin@test.com',
      password: '123456',
      name: '관리자',
      role: 'admin',
      phone: '010-0000-0000'
    };

    // 기존 사용자 확인
    let user = await User.findOne({ email: testUserData.email });
    if (user) {
      Object.assign(user, testUserData);
      await user.save();
      console.log('✅ Test user updated:', user.email);
    } else {
      user = await User.create(testUserData);
      console.log('✅ Test user created:', user.email);
    }

    // 비밀번호 검증
    const isMatch = await user.comparePassword(testUserData.password);
    console.log('Password verification:', isMatch ? '✅ PASS' : '❌ FAIL');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
};

createOrUpdateTestUser(); 