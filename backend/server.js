require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const config = require('./config');
const http = require('http');
const wsServer = require('./websocket/wsServer');
const app = require('./app');
const websocketService = require('./services/websocketService');

logger.info('서버 시작');

// MongoDB 연결 설정
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maekcode';
    logger.info('MongoDB 연결 시도:', { uri: mongoURI });

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      family: 4  // IPv4 강제 사용
    });

    logger.info('✅ MongoDB 연결 성공');
    startServer();
  } catch (err) {
    logger.error('❌ MongoDB 연결 실패:', {
      error: err.message,
      code: err.code
    });
    
    // 연결 실패 시 재시도
    logger.info('5초 후 재연결 시도...');
    setTimeout(connectDB, 5000);
  }
};

// 서버 시작 함수
const startServer = () => {
  const PORT = process.env.PORT || 5000;
  const server = http.createServer(app);
  
  // WebSocket 초기화
  websocketService.initialize(server);
  logger.info('WebSocket 서버 초기화 완료');

  server.listen(PORT, () => {
    logger.info(`🚀 서버가 ${PORT}번 포트에서 실행 중입니다.`);
  });

  server.on('error', (error) => {
    logger.error('서버 에러:', error);
    process.exit(1);
  });
};

// MongoDB 연결 시도
connectDB();

// 프로세스 에러 핸들링
process.on('unhandledRejection', (err) => {
  logger.error('처리되지 않은 Promise 거부:', err);
});

process.on('uncaughtException', (err) => {
  logger.error('처리되지 않은 예외:', err);
});
