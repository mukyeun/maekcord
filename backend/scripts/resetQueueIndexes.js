const mongoose = require('mongoose');
const moment = require('moment-timezone');
const logger = require('../utils/logger');
require('dotenv').config();

async function resetQueueIndexes() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[MongoDB] 연결 성공');

    const Queue = mongoose.connection.collection('queues');

    // 1. 현재 인덱스 확인
    const currentIndexes = await Queue.indexes();
    console.log('[현재 인덱스 목록]:', JSON.stringify(currentIndexes, null, 2));

    // 2. 기존 인덱스 삭제
    const indexesToDrop = [
      'queueNumber_1',
      'patientId_1',
      'date_1_queueNumber_1',
      'patientId_1_date_1',
      'queue_patient_date_unique'
    ];

    for (const indexName of indexesToDrop) {
      try {
        await Queue.dropIndex(indexName);
        console.log(`[인덱스 삭제 완료]: ${indexName}`);
      } catch (error) {
        console.warn(`[인덱스 삭제 건너뜀] (존재하지 않음): ${indexName}`);
      }
    }

    // 3. 문제가 있는 레코드 찾기
    console.log('[진행] 문제가 있는 레코드 찾는 중...');
    const problematicRecords = await Queue.find({
      $or: [
        { sequenceNumber: null },
        { date: null },
        { date: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`[발견] 문제가 있는 레코드: ${problematicRecords.length}개`);

    // 문제가 있는 레코드 출력
    problematicRecords.forEach(record => {
      console.log('[문제 레코드]:', {
        _id: record._id,
        patientId: record.patientId,
        queueNumber: record.queueNumber,
        date: record.date,
        sequenceNumber: record.sequenceNumber
      });
    });

    // 4. 문제가 있는 레코드 수정
    const today = moment().tz('Asia/Seoul').startOf('day').toDate();
    
    for (const record of problematicRecords) {
      // queueNumber에서 마지막 3자리 숫자만 추출 (예: Q20250602-001 -> 1)
      let sequenceNumber = 1;
      if (record.queueNumber) {
        const match = record.queueNumber.match(/-(\d{3})$/);
        if (match) {
          sequenceNumber = parseInt(match[1]);
        }
      }

      // date 설정 (queueNumber에서 날짜 추출)
      let date = today;
      if (record.queueNumber) {
        const dateMatch = record.queueNumber.match(/Q(\d{8})/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          date = moment(dateStr, 'YYYYMMDD').toDate();
        }
      }

      await Queue.updateOne(
        { _id: record._id },
        {
          $set: {
            date: date,
            sequenceNumber: sequenceNumber
          }
        }
      );
      console.log(`[수정 완료] ID: ${record._id}, sequenceNumber: ${sequenceNumber}, date: ${date}`);
    }

    // 5. 새로운 인덱스 생성
    await Queue.createIndex(
      { patientId: 1, date: 1 },
      { 
        unique: true,
        name: 'queue_patient_date_unique'
      }
    );
    console.log('[생성 완료] patientId + date 복합 인덱스');

    await Queue.createIndex(
      { date: 1, sequenceNumber: 1 },
      { 
        unique: true,
        name: 'queue_date_sequence_unique'
      }
    );
    console.log('[생성 완료] date + sequenceNumber 복합 인덱스');

    // 6. 최종 확인
    const updatedIndexes = await Queue.indexes();
    console.log('[최종 인덱스 목록]:', JSON.stringify(updatedIndexes, null, 2));

    console.log('✅ 인덱스 재설정 완료');
    process.exit(0);

  } catch (error) {
    console.error('❌ 인덱스 재설정 실패:', error);
    console.error('에러 상세:', error.stack);
    process.exit(1);
  }
}

resetQueueIndexes(); 