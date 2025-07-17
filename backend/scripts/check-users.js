const mongoose = require('mongoose');
require('dotenv').config();

const checkUsers = async () => {
  try {
    console.log('🔗 MongoDB 연결 시도...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');

    // users 컬렉션의 모든 사용자 조회
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    
    console.log('📋 등록된 사용자 목록:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. 사용자명: ${user.username || 'N/A'}`);
      console.log(`   이메일: ${user.email || 'N/A'}`);
      console.log(`   이름: ${user.name || 'N/A'}`);
      console.log(`   역할: ${user.role || 'N/A'}`);
      console.log(`   활성화: ${user.isActive || 'N/A'}`);
      console.log(`   생성일: ${user.createdAt || 'N/A'}`);
      console.log('---');
    });

    if (users.length === 0) {
      console.log('⚠️ 등록된 사용자가 없습니다.');
      console.log('💡 관리자 계정을 생성하려면: node scripts/create-admin-user.js');
    }

  } catch (error) {
    console.error('❌ 사용자 조회 실패:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결 종료');
  }
};

checkUsers(); 