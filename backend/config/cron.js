const cron = require('node-cron');
const notificationService = require('../services/notificationService');
const logger = require('./logger');

// 매일 오전 9시에 다음날 예약 알림 발송
cron.schedule('0 9 * * *', async () => {
  try {
    logger.info('Running appointment reminder cron job');
    await notificationService.sendAppointmentReminders();
    logger.info('Appointment reminder cron job completed');
  } catch (error) {
    logger.error('Appointment reminder cron job failed:', error);
  }
}); 