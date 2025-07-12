const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function verifyPassword() {
  try {
    console.log('🔍 MongoDB 연결 중...');
    await mongoose.connect('mongodb://127.0.0.1:27017/maekcode');
    console.log('✅ MongoDB 연결 성공!');
    
    // 사용자 찾기 (비밀번호 포함)
    const user = await User.findOne({ email: 'admin@test.com' }).select('+password');
    
    if (!user) {
      console.log('❌ 사용자를 찾을 수 없습니다.');
      return;
    }
    
    console.log('👤 사용자 정보:');
    console.log('- 이메일:', user.email);
    console.log('- 이름:', user.name);
    console.log('- 역할:', user.role);
    console.log('- 비밀번호 해시:', user.password ? '존재함' : '없음');
    
    // 비밀번호 검증
    const testPassword = '123456';
    console.log('\n🔐 비밀번호 검증 테스트:');
    console.log('- 입력 비밀번호:', testPassword);
    console.log('- 해시된 비밀번호 길이:', user.password?.length || 0);
    
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('- 검증 결과:', isMatch ? '✅ 일치' : '❌ 불일치');
    
    if (!isMatch) {
      console.log('\n💡 비밀번호가 일치하지 않습니다. 새로 생성해보겠습니다...');
      
      // 새 비밀번호로 업데이트
      const newHashedPassword = await bcrypt.hash('123456', 10);
      user.password = newHashedPassword;
      await user.save();
      
      console.log('✅ 비밀번호 업데이트 완료!');
      console.log('이제 다시 로그인을 시도해보세요.');
    }
    
    await mongoose.connection.close();
    console.log('\n✅ 연결 종료');
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

verifyPassword(); 