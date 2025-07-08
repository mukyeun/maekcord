require('dotenv').config();
const mongoose = require('mongoose');
const Patient = require('../models/Patient');

const patientId = '685f5a2d952697a330c65b75';

async function checkPatient() {
  try {
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ MongoDB 연결 성공');

    console.log('🔍 환자 ID 유효성 검사:', {
      id: patientId,
      isValid: mongoose.Types.ObjectId.isValid(patientId)
    });

    const patient = await Patient.findById(patientId);
    
    if (!patient) {
      console.log('❌ 환자를 찾을 수 없음');
      return;
    }

    console.log('✅ 환자 정보:', {
      id: patient._id,
      name: patient.basicInfo?.name,
      hasRecords: patient.records != null,
      recordsCount: patient.records?.length || 0,
      recordsType: typeof patient.records,
      isArray: Array.isArray(patient.records)
    });

    if (patient.records && patient.records.length > 0) {
      console.log('\n📋 진료 기록 상세:');
      patient.records.forEach((record, index) => {
        console.log(`\n기록 #${index + 1}:`, {
          id: record._id,
          date: record.date,
          createdAt: record.createdAt,
          visitDateTime: record.visitDateTime,
          symptoms: record.symptoms,
          medications: record.medications,
          memo: record.memo,
          stress: record.stress,
          hasValidDate: !!(record.createdAt || record.date || record.visitDateTime),
          allFields: Object.keys(record.toObject())
        });
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ MongoDB 연결 종료');
    process.exit(0);
  } catch (error) {
    console.error('❌ 에러 발생:', error);
    process.exit(1);
  }
}

checkPatient(); 