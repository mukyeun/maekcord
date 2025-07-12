require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maekcord';
const TEST_USER_ID = process.env.TEST_USER_ID || '65f7e5d4c261b1f3e89d1234';

async function createTestNotifications() {
  try {
    // MongoDB 연결
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB 연결 성공');

    // admin 사용자 찾기
    const admin = await User.findOne({ email: 'admin@test.com' });
    if (!admin) {
      throw new Error('관리자 계정을 찾을 수 없습니다.');
    }

    // 기존 테스트 알림 삭제
    await Notification.deleteMany({ userId: admin._id });

    // 테스트 알림 데이터 생성
    const notifications = [
      {
        userId: admin._id,
        type: 'appointment',
        title: '새로운 예약',
        message: '홍길동 환자님이 내일 오전 10시에 예약하셨습니다.',
        isRead: false
      },
      {
        userId: admin._id,
        type: 'system',
        title: '시스템 알림',
        message: '시스템 점검이 예정되어 있습니다.',
        isRead: false
      },
      {
        userId: admin._id,
        type: 'message',
        title: '새로운 메시지',
        message: '김의사 선생님으로부터 새로운 메시지가 도착했습니다.',
        isRead: false
      }
    ];

    // 알림 저장
    await Notification.insertMany(notifications);

    console.log('✅ 테스트 알림이 성공적으로 생성되었습니다.');
    console.log(`생성된 알림 수: ${notifications.length}`);
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB 연결 종료');
  }
}

// 스크립트 실행
createTestNotifications().catch(error => {
  console.error('치명적인 오류 발생:', error);
  process.exit(1);
}); 