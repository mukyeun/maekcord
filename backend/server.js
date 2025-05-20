require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./utils/logger');
const config = require('./config');
const Patient = require('./models/Patient'); // 반드시 존재해야 함

const app = express();

// 미들웨어 설정
app.use(cors({
  origin: 'http://localhost:3000', // 프론트엔드 주소
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB 연결
mongoose.connect(config.mongodb.uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => logger.info('✅ MongoDB 연결 성공'))
.catch((err) => {
  logger.error('❌ MongoDB 연결 실패:', err.message);
  process.exit(1);
});

// 라우터 - 예시로 환자 등록 라우트 포함
app.post('/api/patients', async (req, res) => {
  try {
    console.log('받은 환자 데이터:', req.body);
    
    // 데이터 유효성 검사
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 환자 데이터입니다.'
      });
    }

    res.status(200).json({
      success: true,
      message: '환자 정보가 성공적으로 저장되었습니다.',
      data: req.body
    });

  } catch (error) {
    console.error('서버 에러:', error);
    res.status(500).json({
      success: false,
      message: '서버 에러가 발생했습니다.',
      error: error.message
    });
  }
});

// 기본 라우트
app.get('/', (req, res) => {
  res.send('서버 실행 중');
});

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  console.error('글로벌 에러 핸들러:', err);
  res.status(500).json({
    success: false,
    message: '서버에서 예상치 못한 에러가 발생했습니다.',
    error: err.message
  });
});

// 서버 시작
const PORT = config.port || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
