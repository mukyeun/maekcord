require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./utils/logger');
const config = require('./config');
const Patient = require('./models/Patient'); // 반드시 존재해야 함
const queueRoutes = require('./routes/queueRoutes');
const patientRoutes = require('./routes/patientRoutes');
const pulseMapRoutes = require('./routes/pulseMap');
const pulseMapFullRouter = require('./routes/pulseMapFull');
const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/authRoutes');
const pulseRoutes = require('./routes/pulse');
const http = require('http');
const wsServer = require('./websocket/wsServer');

const app = express();

// CORS 설정
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트 등록
app.use('/api/auth', authRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/pulse-map', pulseMapRoutes);
app.use('/api/pulse-map-full', pulseMapFullRouter);
app.use('/api/reports', reportRoutes);
app.use('/api/pulse', pulseRoutes);

// 기본 라우트 (테스트용)
app.get('/', (req, res) => {
  res.json({ message: 'API 서버가 정상적으로 실행 중입니다.' });
});

// 404 처리
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `요청하신 경로 ${req.path}를 찾을 수 없습니다.` 
  });
});

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error('서버 에러:', err);
  
  // 커스텀 에러 클래스들의 상태 코드 처리
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || '요청 처리 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
  
  // JWT 관련 에러 처리
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '만료된 토큰입니다.'
    });
  }
  
  // MongoDB 관련 에러 처리
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: '데이터 중복 오류가 발생했습니다.'
      });
    }
    return res.status(500).json({
      success: false,
      message: '데이터베이스 오류가 발생했습니다.'
    });
  }
  
  // Validation 에러 처리
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '입력값 검증 오류가 발생했습니다.',
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }
  
  // 기본 500 에러 응답
  res.status(500).json({
    success: false,
    message: '서버 내부 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

logger.info('서버 시작');

// MongoDB 연결 설정
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maekcord';
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
  wsServer.init(server);

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
