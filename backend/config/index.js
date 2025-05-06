require('dotenv').config();

const config = {
  // 서버 설정
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  
  // 데이터베이스
  mongodb: {
    uri: process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI 
      : process.env.MONGODB_URI,
  },
  
  // JWT 설정
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // 보안 설정
  security: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
    lockTime: parseInt(process.env.LOCK_TIME, 10) || 300000 // 5분
  },
  
  // CORS 설정
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },
  
  // 이메일 설정
  email: {
    enabled: process.env.NODE_ENV === 'production', // 개발 환경에서는 비활성화
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'test@example.com',
      pass: process.env.EMAIL_PASS || 'testpassword'
    }
  },
  
  // 로깅
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  },
  
  timezone: process.env.TIMEZONE || 'Asia/Seoul',
  
  // 예약 관련
  appointment: {
    maxPerDay: parseInt(process.env.MAX_APPOINTMENTS_PER_DAY) || 50,
    cancellationDeadlineHours: parseInt(process.env.CANCELLATION_DEADLINE_HOURS) || 24
  }
};

// 필수 환경변수 검증
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Environment variable ${envVar} is required`);
  }
});

module.exports = config; 