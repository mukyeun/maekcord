const mongoose = require('mongoose');
const Patient = require('../models/patient');

mongoose.connect('mongodb://127.0.0.1:27017/maekstation', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB에 연결되었습니다.');
}).catch((err) => {
  console.error('MongoDB 연결 오류:', err);
});

async function addTestPatient() {
  try {
    const patient = new Patient({
      _id: "6811d679703d2f5e751b83db",
      name: "테스트 환자",
      gender: "male",
      birthDate: new Date("1990-01-01"),
      contact: {
        phone: "010-1234-5678"
      }
    });
    await patient.save();
    console.log('테스트 환자가 추가되었습니다.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

addTestPatient();