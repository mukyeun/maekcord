const mongoose = require('mongoose');

// 환경변수 설정
process.env.JWT_SECRET = 'your-secret-key-here';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/maekcode';

async function checkAllCollections() {
  try {
    console.log('🔍 MongoDB 연결 중...');
    await mongoose.connect('mongodb://127.0.0.1:27017/maekcode');
    console.log('✅ MongoDB 연결 성공!');
    
    const db = mongoose.connection.db;
    
    // 모든 컬렉션 목록 조회
    const collections = await db.listCollections().toArray();
    console.log('\n📋 데이터베이스 컬렉션 목록:');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    
    // 주요 컬렉션별 데이터 확인
    console.log('\n📊 주요 컬렉션 데이터 현황:');
    
    // users 컬렉션
    const users = await db.collection('users').find({}).toArray();
    console.log(`\n👥 users 컬렉션: ${users.length}개 문서`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name}) - ${user.role}`);
    });
    
    // queues 컬렉션
    const queues = await db.collection('queues').find({}).toArray();
    console.log(`\n🏥 queues 컬렉션: ${queues.length}개 문서`);
    queues.forEach((queue, index) => {
      console.log(`   ${index + 1}. 환자: ${queue.patientName || 'N/A'} - 상태: ${queue.status || 'N/A'}`);
    });
    
    // patients 컬렉션
    const patients = await db.collection('patients').find({}).toArray();
    console.log(`\n👤 patients 컬렉션: ${patients.length}개 문서`);
    patients.forEach((patient, index) => {
      console.log(`   ${index + 1}. ${patient.name || 'N/A'} (${patient.phoneNumber || 'N/A'})`);
    });
    
    // records 컬렉션 (있다면)
    try {
      const records = await db.collection('records').find({}).toArray();
      console.log(`\n📝 records 컬렉션: ${records.length}개 문서`);
    } catch (error) {
      console.log('\n📝 records 컬렉션: 존재하지 않음');
    }
    
    console.log('\n✅ 모든 컬렉션 확인 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 연결 종료');
  }
}

checkAllCollections(); 