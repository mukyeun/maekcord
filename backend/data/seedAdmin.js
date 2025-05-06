require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { USER_ROLES } = require('../config/constants');
const logger = require('../utils/logger');

const adminUser = {
  username: 'admin',
  password: 'admin1234!',  // 실제 운영 환경에서는 더 강력한 비밀번호 사용
  name: '관리자',
  role: USER_ROLES.ADMIN,
  email: 'admin@maekstation.com',
  phone: '010-0000-0000',
  isActive: true
};

const seedAdmin = async () => {
  try {
    // DB 연결
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // 기존 관리자 확인
    const existingAdmin = await User.findOne({ username: adminUser.username });
    
    if (existingAdmin) {
      logger.info('Admin user already exists');
      return;
    }

    // 관리자 계정 생성
    const newAdmin = new User(adminUser);
    await newAdmin.save();
    
    logger.info('Admin user created successfully');

  } catch (error) {
    logger.error('Error seeding admin user:', error);
  } finally {
    // DB 연결 종료
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  }
};

// 스크립트 실행
seedAdmin(); 