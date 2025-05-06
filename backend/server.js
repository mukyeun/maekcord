require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./config');
const logger = require('./utils/logger');
const express = require('express');
const app = express();

// MongoDB 연결 옵션
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// MongoDB 연결
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return; // 이미 연결된 경우 조용히 반환
    }
    await mongoose.connect(config.mongodb.uri, mongooseOptions);
    logger.info('MongoDB 연결 성공');
  } catch (err) {
    logger.error('MongoDB 연결 실패:', err.message);
    process.exit(1);
  }
};

// 서버 시작 함수
const startServer = () => {
  if (!module.parent) {
    const server = app.listen(config.port, () => {
      logger.info(`서버가 포트 ${config.port}에서 실행 중입니다. (${process.env.NODE_ENV} 모드)`);
    });

    // 프로세스 종료 시 정리
    process.on('SIGTERM', () => {
      server.close(() => {
        mongoose.connection.close(false, () => {
          logger.info('서버와 MongoDB 연결을 종료했습니다.');
          process.exit(0);
        });
      });
    });

    return server;
  }
};

// 서버 시작
connectDB().then(() => {
  const server = startServer();
  if (server) {
    module.exports = server;
  }
});
