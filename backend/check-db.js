const mongoose = require('mongoose');

// 환경변수 설정
process.env.JWT_SECRET = 'your-secret-key-here';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/maekcode';

async function checkUsers() {
  try {
    console.log('🔍 MongoDB 연결 중...');
    await mongoose.connect('mongodb://127.0.0.1:27017/maekcode');
    console.log('✅ MongoDB 연결 성공!');
    
    // users 컬렉션 조회
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    
    console.log('\n📊 사용자 목록:');
    console.log(`총 ${users.length}명의 사용자가 있습니다.`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. 사용자 정보:`);
      console.log(`   - 이메일: ${user.email || 'N/A'}`);
      console.log(`   - 이름: ${user.name || 'N/A'}`);
      console.log(`   - 역할: ${user.role || 'N/A'}`);
      console.log(`   - 비밀번호 해시: ${user.password ? '존재함' : '없음'}`);
      console.log(`   - 상태: ${user.status || 'N/A'}`);
    });
    
    // admin@test.com 사용자 확인
    const adminUser = users.find(u => u.email === 'admin@test.com');
    if (adminUser) {
      console.log('\n✅ admin@test.com 사용자가 존재합니다!');
      console.log(`   - 이름: ${adminUser.name}`);
      console.log(`   - 역할: ${adminUser.role}`);
      console.log(`   - 비밀번호 해시: ${adminUser.password ? '존재함' : '없음'}`);
    } else {
      console.log('\n❌ admin@test.com 사용자가 없습니다.');
    }
    
    await mongoose.connection.close();
    console.log('\n✅ 연결 종료');
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

checkUsers(); 