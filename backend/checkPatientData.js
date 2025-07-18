const mongoose = require('mongoose');
const Patient = require('./models/Patient');

mongoose.connect('mongodb://127.0.0.1:27017/maekcode')
  .then(async () => {
    console.log('MongoDB Connected');
    const patientId = '685f5a2d952697a330c65b75';
    console.log('🔍 환자 ID로 조회:', patientId);

    const patient = await Patient.findById(patientId);

    if (!patient) {
      console.log('❌ 환자를 찾을 수 없습니다.');
      return;
    }

    console.log('✅ 환자 정보:');
    console.log('- 이름:', patient.basicInfo?.name);
    console.log('- 환자 ID:', patient.patientId);
    console.log('- 상태:', patient.status);

    console.log('\n📋 진료 기록 정보:');
    console.log('- records 타입:', typeof patient.records);
    console.log('- records가 배열인가:', Array.isArray(patient.records));
    console.log('- records 개수:', patient.records?.length || 0);
    if (patient.records && patient.records.length > 0) {
      console.log('\n📝 첫 번째 기록:');
      const firstRecord = patient.records[0];
      console.log('- ID:', firstRecord._id);
      console.log('- 생성일:', firstRecord.createdAt);
      console.log('- 증상:', firstRecord.symptoms);
      console.log('- 메모:', firstRecord.memo);
    } else {
      console.log('❌ 진료 기록이 없습니다.');
    }

    mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ MongoDB 연결 실패:', err);
  }); 