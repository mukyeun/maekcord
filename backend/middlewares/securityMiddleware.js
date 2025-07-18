const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const jwt = require('jsonwebtoken');

// 기본 보안 헤더 설정
const basicSecurity = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// 요청 제한 설정
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100개 요청
  message: {
    success: false,
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API 요청 제한 (더 엄격)
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 50, // 최대 50개 요청
  message: {
    success: false,
    message: 'API 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 로그인 요청 제한
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5번 시도
  message: {
    success: false,
    message: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// MongoDB 인젝션 방지
const mongoSanitizer = mongoSanitize();

// XSS 방지
const xssProtection = xss();

// HTTP Parameter Pollution 방지
const hppProtection = hpp();

// CORS 설정
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Client-Version'
  ],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400 // 24시간
};

// 보안 헤더 추가
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
};

// 입력 데이터 검증
const inputValidation = (req, res, next) => {
  // SQL 인젝션 패턴 검사
  const sqlInjectionPattern = /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script)\b)/i;
  
  const checkForSQLInjection = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string' && sqlInjectionPattern.test(obj[key])) {
        return true;
      }
      if (typeof obj[key] === 'object' && checkForSQLInjection(obj[key])) {
        return true;
      }
    }
    return false;
  };

  if (checkForSQLInjection(req.body) || checkForSQLInjection(req.query)) {
    return res.status(400).json({
      success: false,
      message: '잘못된 입력이 감지되었습니다.'
    });
  }

  next();
};

// 로그인 시도 추적
const loginAttemptTracker = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // 로그인 시도 기록 (실제로는 Redis나 DB에 저장)
  console.log(`🔐 로그인 시도: ${clientIP} - ${now}`);
  
  next();
};

// 토큰 갱신 미들웨어 추가
const refreshTokenMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const now = Date.now() / 1000;
      
      // 토큰 만료 1간 전에 갱신
      if (decoded.exp - now < 3600) {
        const newToken = jwt.sign(
          { id: decoded.id, role: decoded.role },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
        
        res.setHeader('X-New-Token', newToken);
      }
    } catch (error) {
      // 토큰 검증 실패 시 무시 (기존 인증 미들웨어에서 처리)
    }
  }
  
  next();
};

module.exports = {
  basicSecurity,
  rateLimiter,
  apiRateLimiter,
  loginRateLimiter,
  mongoSanitizer,
  xssProtection,
  hppProtection,
  corsOptions,
  securityHeaders,
  inputValidation,
  loginAttemptTracker,
  refreshTokenMiddleware
}; 