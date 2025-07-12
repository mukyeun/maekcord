const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 환경변수 설정
process.env.JWT_SECRET = 'your-secret-key-here';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/maekcode';

async function testPassword() {
  try {
    console.log('🔍 MongoDB 연결 중...');
    await mongoose.connect('mongodb://127.0.0.1:27017/maekcode');
    console.log('✅ MongoDB 연결 성공!');
    
    // admin@test.com 사용자 조회
    const user = await mongoose.connection.db.collection('users').findOne({ email: 'admin@test.com' });
    
    if (!user) {
      console.log('❌ admin@test.com 사용자를 찾을 수 없습니다.');
      return;
    }
    
    console.log('👤 사용자 정보:');
    console.log(`   - 이메일: ${user.email}`);
    console.log(`   - 이름: ${user.name}`);
    console.log(`   - 역할: ${user.role}`);
    console.log(`   - 비밀번호 해시 길이: ${user.password?.length || 0}`);
    
    // 비밀번호 테스트
    const testPasswords = ['123456', 'password', 'admin', 'test'];
    
    console.log('\n🔐 비밀번호 테스트:');
    for (const testPassword of testPasswords) {
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log(`   - "${testPassword}": ${isMatch ? '✅ 일치' : '❌ 불일치'}`);
    }
    
    // 새 비밀번호로 업데이트 (필요한 경우)
    const correctPassword = '123456';
    const isCorrect = await bcrypt.compare(correctPassword, user.password);
    
    if (!isCorrect) {
      console.log('\n💡 비밀번호가 일치하지 않습니다. 새로 설정하겠습니다...');
      
      const newHashedPassword = await bcrypt.hash('123456', 10);
      await mongoose.connection.db.collection('users').updateOne(
        { email: 'admin@test.com' },
        { $set: { password: newHashedPassword } }
      );
      
      console.log('✅ 비밀번호 업데이트 완료!');
      console.log('이제 admin@test.com / 123456으로 로그인할 수 있습니다.');
    } else {
      console.log('\n✅ 비밀번호가 올바릅니다!');
      console.log('admin@test.com / 123456으로 로그인해보세요.');
    }
    
    await mongoose.connection.close();
    console.log('\n✅ 연결 종료');
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

testPassword(); 