const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    console.log('🔗 MongoDB 연결 시도...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');

    // 기존 관리자 확인
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️ 관리자 계정이 이미 존재합니다.');
      console.log('📧 이메일:', existingAdmin.email);
      console.log('👤 이름:', existingAdmin.name);
      console.log('🔑 역할:', existingAdmin.role);
      return;
    }

    // 관리자 계정 생성
    const adminUser = {
      username: 'admin',
      password: await bcrypt.hash('admin1234', 10),
      role: 'admin',
      name: '시스템 관리자',
      email: 'admin@maekstation.com',
      phone: '010-0000-0000',
      isActive: true
    };

    const admin = await User.create(adminUser);

    console.log('✅ 관리자 계정 생성 성공!');
    console.log('📧 이메일:', admin.email);
    console.log('👤 이름:', admin.name);
    console.log('🔑 역할:', admin.role);
    console.log('🔑 초기 비밀번호: admin1234');
    console.log('⚠️ 보안을 위해 첫 로그인 후 비밀번호를 변경하세요.');

  } catch (error) {
    console.error('❌ 관리자 계정 생성 실패:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결 종료');
  }
};

// 스크립트 실행
createAdminUser(); 