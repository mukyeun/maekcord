const mongoose = require('mongoose');
const moment = require('moment-timezone');
const Queue = require('../models/Queue');
const Patient = require('../models/Patient');
require('dotenv').config();

const createTestQueues = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // 기존 오늘 큐 데이터 삭제
    const today = moment().format('YYYY-MM-DD');
    await Queue.deleteMany({ 
      date: { 
        $gte: moment(today).startOf('day').toDate(),
        $lte: moment(today).endOf('day').toDate()
      }
    });
    console.log('기존 오늘 큐 데이터 삭제 완료');

    // 환자 데이터 가져오기
    const patients = await Patient.find().limit(5);
    console.log(`${patients.length}명의 환자 데이터 확인`);

    if (patients.length === 0) {
      console.log('환자 데이터가 없습니다. 먼저 환자 데이터를 생성해주세요.');
      return;
    }

    const todayDate = moment().toDate();
    const queues = [];

    // 대기 중인 환자들
    for (let i = 0; i < Math.min(3, patients.length); i++) {
      const patient = patients[i];
      const queueNumber = i + 1;
      
      queues.push({
        patientId: patient._id,
        patientName: patient.basicInfo.name,
        patientIdNumber: patient.basicInfo.patientId,
        queueNumber: queueNumber,
        status: 'waiting',
        priority: i === 0 ? 'high' : 'normal', // 첫 번째 환자는 높은 우선순위
        visitType: i === 0 ? 'revisit' : 'first', // 첫 번째 환자는 재진
        department: '내과',
        doctorId: '6811d5ee703d2f5e751b83d8',
        doctorName: '김의사',
        date: todayDate,
        estimatedTime: moment().add(queueNumber * 15, 'minutes').toDate(),
        createdAt: moment().subtract(queueNumber * 5, 'minutes').toDate(),
        updatedAt: new Date()
      });
    }

    // 진료 중인 환자
    if (patients.length >= 4) {
      queues.push({
        patientId: patients[3]._id,
        patientName: patients[3].basicInfo.name,
        patientIdNumber: patients[3].basicInfo.patientId,
        queueNumber: 4,
        status: 'in_progress',
        priority: 'normal',
        visitType: 'first',
        department: '내과',
        doctorId: '6811d5ee703d2f5e751b83d8',
        doctorName: '김의사',
        date: todayDate,
        estimatedTime: moment().add(30, 'minutes').toDate(),
        createdAt: moment().subtract(20, 'minutes').toDate(),
        updatedAt: new Date()
      });
    }

    // 완료된 환자
    if (patients.length >= 5) {
      queues.push({
        patientId: patients[4]._id,
        patientName: patients[4].basicInfo.name,
        patientIdNumber: patients[4].basicInfo.patientId,
        queueNumber: 5,
        status: 'completed',
        priority: 'normal',
        visitType: 'revisit',
        department: '내과',
        doctorId: '6811d5ee703d2f5e751b83d8',
        doctorName: '김의사',
        date: todayDate,
        estimatedTime: moment().subtract(30, 'minutes').toDate(),
        createdAt: moment().subtract(60, 'minutes').toDate(),
        updatedAt: moment().subtract(30, 'minutes').toDate()
      });
    }

    await Queue.insertMany(queues);
    console.log(`${queues.length}개의 큐 데이터 생성 완료`);

    // 생성된 큐 데이터 확인
    const todayQueues = await Queue.find({
      date: {
        $gte: moment(today).startOf('day').toDate(),
        $lte: moment(today).endOf('day').toDate()
      }
    }).sort({ queueNumber: 1 });

    console.log('\n생성된 큐 데이터:');
    todayQueues.forEach(queue => {
      console.log(`- ${queue.queueNumber}번: ${queue.patientName} (${queue.status}, ${queue.priority} 우선순위)`);
    });

  } catch (error) {
    console.error('Error creating test queues:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
};

createTestQueues(); 