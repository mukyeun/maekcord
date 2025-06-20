const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PulseProfile = require('../models/PulseProfile');

async function importPulseProfiles() {
  try {
    // MongoDB 연결
    await mongoose.connect('mongodb://127.0.0.1:27017/maekcord_a', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB 연결 성공');

    // 기존 데이터 삭제
    await PulseProfile.deleteMany({});
    console.log('🗑 기존 맥상 프로파일 데이터 삭제 완료');

    // JSON 파일 읽기
    const jsonPath = path.join(__dirname, '../../pulse_profiles_81.json');
    console.log('📂 파일 경로:', jsonPath);
    
    const rawData = await fs.readFile(jsonPath, 'utf8');
    const profiles = JSON.parse(rawData);
    console.log(`📊 JSON 파일에서 ${profiles.length}개의 프로파일을 읽었습니다.`);

    // MongoDB에 저장
    await PulseProfile.insertMany(profiles);
    console.log(`✅ ${profiles.length}개의 맥상 프로파일 데이터 등록 완료`);

    // 저장된 데이터 확인
    const count = await PulseProfile.countDocuments();
    console.log(`📊 현재 DB에 저장된 맥상 프로파일 수: ${count}`);

    // 샘플 데이터 출력
    const sample = await PulseProfile.findOne();
    console.log('\n📝 샘플 데이터:', JSON.stringify(sample, null, 2));

  } catch (error) {
    console.error('❌ 데이터 등록 중 오류 발생:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('📡 MongoDB 연결 종료');
  }
}

// 스크립트 실행
importPulseProfiles(); 