const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/database');
const securityMiddleware = require('./middlewares/securityMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// WebSocket 서버 설정
const expressWs = require('express-ws');
expressWs(app);

// 보안 미들웨어 적용
app.use(securityMiddleware.basicSecurity);
app.use(securityMiddleware.securityHeaders);
app.use(securityMiddleware.mongoSanitizer);
app.use(securityMiddleware.xssProtection);
app.use(securityMiddleware.hppProtection);
app.use(securityMiddleware.inputValidation);

// CORS 설정
app.use(cors(securityMiddleware.corsOptions));

// 요청 크기 제한
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 로깅 미들웨어
app.use(morgan('combined'));

// WebSocket 연결 처리
app.ws('/', (ws, req) => {
  console.log('🔗 WebSocket 연결됨:', req.ip);
  
  // 연결 시 환영 메시지 전송
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    message: 'WebSocket 연결이 성공했습니다.',
    timestamp: new Date().toISOString()
  }));
  
  // 메시지 수신 처리
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      console.log('📨 WebSocket 메시지 수신:', data);
      
      // 메시지 타입에 따른 처리
      switch (data.type) {
        case 'PING':
          ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
          break;
        case 'QUEUE_UPDATE':
          // 대기열 업데이트 브로드캐스트
          broadcastToAllClients({
            type: 'QUEUE_UPDATE',
            data: data.data,
            timestamp: new Date().toISOString()
          });
          break;
        case 'PATIENT_CALLED':
          // 환자 호출 브로드캐스트
          broadcastToAllClients({
            type: 'PATIENT_CALLED',
            data: data.data,
            timestamp: new Date().toISOString()
          });
          break;
        default:
          console.log('⚠️ 알 수 없는 메시지 타입:', data.type);
      }
    } catch (error) {
      console.error('❌ WebSocket 메시지 파싱 오류:', error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: '메시지 형식이 올바르지 않습니다.',
        timestamp: new Date().toISOString()
      }));
    }
  });
  
  // 연결 종료 처리
  ws.on('close', () => {
    console.log('🔌 WebSocket 연결 종료:', req.ip);
  });
  
  // 에러 처리
  ws.on('error', (error) => {
    console.error('❌ WebSocket 에러:', error);
  });
});

// 모든 클라이언트에게 메시지 브로드캐스트
function broadcastToAllClients(message) {
  const clients = app.getWss().clients;
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(message));
    }
  });
}

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '맥진 진단 시스템 API 서버가 실행 중입니다.',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '서버가 정상적으로 작동 중입니다.',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// 라우트 설정 (임시로 주석 처리)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/queues', require('./routes/queueRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/waitlist', require('./routes/waitlistRoutes'));
app.use('/api/statistics', require('./routes/statisticsRoutes'));
app.use('/api/pulse-map', require('./routes/pulseMap'));
app.use('/api/pulse', require('./routes/pulse'));
app.use('/api', require('./routes/visitRoutes'));
app.use('/api/patient-data', require('./routes/patientData'));
app.use('/api/data-export', require('./routes/dataExport'));

// Swagger 문서
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Maekcord API',
      version: '1.0.0',
      description: '맥진 진단 시스템 API 문서',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: '개발 서버',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '서버 내부 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다.'
  });
});

// 서버 시작
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`📚 API 문서: http://localhost:${PORT}/api-docs`);
      console.log(`🔗 서버 URL: http://localhost:${PORT}`);
      console.log(`🏥 헬스 체크: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('❌ 서버 시작 중 오류:', error);
    process.exit(1);
  }
};

startServer();