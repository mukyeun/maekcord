const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    console.log('🔍 MongoDB 연결 중...');
    await mongoose.connect('mongodb://127.0.0.1:27017/maekcode');
    console.log('✅ MongoDB 연결 성공!');
    
    // 기존 사용자 확인
    const existingUser = await User.findOne({ email: 'admin@test.com' });
    if (existingUser) {
      console.log('⚠️  이미 존재하는 사용자입니다: admin@test.com');
      console.log('이메일: admin@test.com');
      console.log('비밀번호: 123456');
      return;
    }
    
    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // 테스트 사용자 생성
    const testUser = new User({
      email: 'admin@test.com',
      password: hashedPassword,
      name: '관리자',
      role: 'admin'
    });
    
    await testUser.save();
    console.log('✅ 테스트 사용자 생성 완료!');
    console.log('\n=== 로그인 정보 ===');
    console.log('이메일: admin@test.com');
    console.log('비밀번호: 123456');
    console.log('역할: admin');
    console.log('\n💡 이 정보로 로그인해보세요!');
    
    await mongoose.connection.close();
    console.log('\n✅ 연결 종료');
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

createTestUser(); 