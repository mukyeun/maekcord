const mongoose = require('mongoose');
const PulseProfile = require('../models/PulseProfile');

async function checkPulseProfiles() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/maekcord', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB 연결 성공');

    // 전체 데이터 수 확인
    const count = await PulseProfile.countDocuments();
    console.log(`📊 총 ${count}개의 맥상 프로파일이 저장되어 있습니다.`);

    // 모든 데이터 조회
    const profiles = await PulseProfile.find();
    console.log('\n📝 저장된 맥상 프로파일:');
    profiles.forEach(profile => {
      console.log(`\n🔍 ${profile.pulseCode}:`);
      console.log('- PVC:', profile.pvcType);
      console.log('- BV:', profile.bvType);
      console.log('- SV:', profile.svType);
      console.log('- HR:', profile.hrType);
      console.log('- Description:', profile.description);
    });

    // 특정 조합 테스트
    const testQuery = {
      pvcType: '활',
      bvType: '삭',
      svType: '침',
      hrType: '허'
    };
    console.log('\n🔍 테스트 쿼리:', testQuery);
    const testResult = await PulseProfile.findOne(testQuery);
    console.log('📋 테스트 결과:', testResult ? '찾음' : '못찾음');
    if (testResult) {
      console.log(testResult);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 MongoDB 연결 종료');
  }
}

checkPulseProfiles(); 