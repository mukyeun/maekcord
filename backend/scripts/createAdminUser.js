const mongoose = require(mongoose);
const bcrypt = require(bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 연결 성공);

    // 기존 관리자 확인
    const existingAdmin = await User.findOne({ email: 'admin@test.com' });
    if (existingAdmin) {
      console.log('⚠️ 관리자 계정이 이미 존재합니다.');
      console.log('이메일:', existingAdmin.email);
      console.log('역할:', existingAdmin.role);
      return;
    }

    // 비밀번호 해시화
    const saltRounds =12;
    const hashedPassword = await bcrypt.hash('admin123 saltRounds);

    // 관리자 사용자 생성
    const adminUser = new User({
      email: admin@test.com,     password: hashedPassword,
      name: 관리자',
      role:admin,    isActive: true,
      lastLogin: new Date()
    });

    await adminUser.save();
    console.log('✅ 관리자 계정 생성 완료');
    console.log('이메일: admin@test.com');
    console.log('비밀번호: admin123);
    console.log(역할: admin');

  } catch (error) {
    console.error(❌ 관리자 계정 생성 실패:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결 종료);
  }
};

// 스크립트 실행
if (require.main === module) {
  createAdminUser();
}

module.exports = createAdminUser; 