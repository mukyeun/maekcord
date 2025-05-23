require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./utils/logger');
const config = require('./config');
const Patient = require('./models/Patient'); // 반드시 존재해야 함
const queueRoutes = require('./routes/queueRoutes');
const patientRoutes = require('./routes/patientRoutes');

const app = express();

// 미들웨어 설정
app.use(cors({
  origin: 'http://localhost:3000', // 프론트엔드 주소
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트 등록
app.use('/api/patients', patientRoutes);
app.use('/api/queues', queueRoutes);

// 디버깅을 위한 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maekstation')
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error('서버 에러:', err);
  res.status(500).json({
    success: false,
    message: '서버 에러가 발생했습니다.',
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log('📌 대기목록 조회: GET http://localhost:5000/api/queues');
});
