const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function resetAdminPassword() {
  try {
    // MongoDB 연결
    await mongoose.connect('mongodb://127.0.0.1:27017/maekcord', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB 연결 성공');

    // 새 비밀번호 해시
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // admin 사용자 찾아서 비밀번호 업데이트
    const result = await User.findOneAndUpdate(
      { email: 'admin@test.com' },
      { 
        $set: { 
          password: hashedPassword,
          loginAttempts: 0,
          lockUntil: null
        }
      },
      { new: true }
    );

    if (result) {
      console.log('✅ 관리자 비밀번호가 성공적으로 재설정되었습니다.');
      console.log('이메일:', result.email);
      console.log('새 비밀번호: 123456');
    } else {
      console.log('❌ 관리자 계정을 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB 연결 종료');
  }
}

resetAdminPassword(); 