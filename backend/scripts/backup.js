const { exec } = require('child_process');
const moment = require('moment');
const config = require('../config');
const logger = require('../utils/logger');

const backupDB = () => {
  const timestamp = moment().format('YYYY-MM-DD_HH-mm');
  const dbName = config.mongodb.uri.split('/').pop().split('?')[0];
  const backupPath = `./backups/mongodb_${dbName}_${timestamp}`;

  const cmd = `mongodump --uri="${config.mongodb.uri}" --out="${backupPath}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      logger.error('Database backup failed:', error);
      return;
    }
    logger.info(`Database backup completed: ${backupPath}`);
  });
};

// 백업 실행
backupPath(); 