const mongoose = require('mongoose');
const logger = require('./logger');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    logger.info('Using existing database connection');
    return;
  }

  try {
    // 기존 모델 정의 제거
    Object.keys(mongoose.connection.models).forEach(modelName => {
      delete mongoose.connection.models[modelName];
    });

    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    logger.info('MongoDB Connected');

    // 모든 모델 한 번에 정의
    require('../models/user');
    require('../models/patient');
    require('../models/appointment');

  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
};

// 연결 이벤트 리스너
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB 연결이 끊어졌습니다. 재연결을 시도합니다.');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB 에러:', err);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB 연결을 종료하고 프로세스를 종료합니다.');
  process.exit(0);
});

module.exports = connectDB; 