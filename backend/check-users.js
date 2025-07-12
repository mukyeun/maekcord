const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    console.log('🔍 MongoDB 연결 중...');
    await mongoose.connect('mongodb://127.0.0.1:27017/maekcode');
    console.log('✅ MongoDB 연결 성공!');
    
    const users = await User.find({}).select('email name role');
    console.log('\n=== 사용자 목록 ===');
    
    if (users.length === 0) {
      console.log('❌ 데이터베이스에 사용자가 없습니다.');
      console.log('\n💡 테스트용 사용자를 생성하려면:');
      console.log('1. 회원가입 기능 사용');
      console.log('2. 또는 MongoDB Compass에서 직접 추가');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. 이메일: ${user.email}`);
        console.log(`   이름: ${user.name}`);
        console.log(`   역할: ${user.role}`);
        console.log('---');
      });
    }
    
    await mongoose.connection.close();
    console.log('\n✅ 연결 종료');
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

checkUsers(); 