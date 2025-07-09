const cron = require('node-cron');
const backupService = require('../services/backup.service');
const logger = require('../utils/logger');

class BackupScheduler {
  constructor() {
    // 기본적으로 매일 새벽 3시에 백업 실행
    this.schedule = process.env.BACKUP_SCHEDULE || '0 3 * * *';
  }

  start() {
    logger.info('백업 스케줄러 시작');
    
    cron.schedule(this.schedule, async () => {
      try {
        logger.info('예약된 백업 시작');
        await backupService.createBackup();
        logger.info('예약된 백업 완료');
      } catch (error) {
        logger.error('예약된 백업 실패:', error);
      }
    });
  }
}

module.exports = new BackupScheduler(); 