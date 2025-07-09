require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/maekcord';

async function createAdminUser() {
  try {
    // MongoDB 연결
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB 연결 성공');

    // 기본 관리자 계정 정보
    const adminData = {
      username: 'admin',
      password: 'admin1234',  // 실제 운영 환경에서는 더 강력한 비밀번호 사용
      email: 'admin@example.com',
      role: 'admin',
      name: '관리자',
      isActive: true
    };

    // 이미 존재하는지 확인
    const existingAdmin = await User.findOne({ username: adminData.username });
    if (existingAdmin) {
      logger.info('관리자 계정이 이미 존재합니다.');
      process.exit(0);
    }

    // 비밀번호 해시화
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);
    adminData.password = hashedPassword;

    // 관리자 계정 생성
    const admin = new User(adminData);
    await admin.save();

    logger.info('관리자 계정이 성공적으로 생성되었습니다.');
    logger.info('username: admin');
    logger.info('password: admin1234');

  } catch (error) {
    logger.error('관리자 계정 생성 중 오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdminUser(); 