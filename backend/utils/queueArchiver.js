const Queue = require('../models/Queue');
const QueueHistory = require('../models/QueueHistory');
const logger = require('./logger');
const moment = require('moment-timezone');

const archiveOldQueues = async () => {
  const yesterday = moment().tz('Asia/Seoul').subtract(1, 'days').startOf('day').toDate();
  
  try {
    // 완료된 대기 건 아카이브
    const completedQueues = await Queue.find({
      status: { $in: ['COMPLETED', 'CANCELLED'] },
      isArchived: false,
      updatedAt: { $lt: yesterday }
    });

    logger.info(`아카이브 대상 건수: ${completedQueues.length}`);

    for (const queue of completedQueues) {
      queue.isArchived = true;
      queue.archivedAt = new Date();
      queue.archivedReason = '일일 자동 아카이브';
      await queue.save();

      // 이력 저장
      await QueueHistory.create({
        queueId: queue._id,
        patientId: queue.patientId,
        previousStatus: queue.status,
        newStatus: 'ARCHIVED',
        changedBy: 'SYSTEM',
        reason: '일일 자동 아카이브'
      });
    }

    logger.info(`아카이브 처리 완료: ${completedQueues.length}건`);
    return completedQueues.length;
  } catch (error) {
    logger.error('아카이브 처리 중 오류 발생:', error);
    throw error;
  }
};

module.exports = {
  archiveOldQueues
}; 