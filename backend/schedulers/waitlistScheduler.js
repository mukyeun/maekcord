const cron = require('node-cron');
const Waitlist = require('../models/Waitlist');
const notificationService = require('../services/notificationService');
const logger = require('../config/logger');

// 매일 자정에 실행
cron.schedule('0 0 * * *', async () => {
  try {
    logger.info('Running waitlist expiration check');

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // 3일 후 만료 예정인 대기 신청 조회
    const expiringWaitlists = await Waitlist.find({
      status: 'waiting',
      expiresAt: {
        $gt: new Date(),
        $lt: threeDaysFromNow
      }
    });

    logger.info(`Found ${expiringWaitlists.length} waitlists expiring soon`);

    // 만료 예정 알림 전송
    for (const waitlist of expiringWaitlists) {
      await notificationService.notifyWaitlistExpiringSoon(waitlist._id);
    }

    // 만료된 대기 신청 처리
    const expiredWaitlists = await Waitlist.updateMany(
      {
        status: 'waiting',
        expiresAt: { $lt: new Date() }
      },
      {
        $set: {
          status: 'expired',
          notes: '만료 기간 경과'
        }
      }
    );

    logger.info(`Updated ${expiredWaitlists.modifiedCount} expired waitlists`);
  } catch (error) {
    logger.error('Waitlist scheduler error:', error);
  }
}); 