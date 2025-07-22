const crypto = require('crypto');

// 보안 설정
const securityConfig = {
  // JWT 설정
  jwt: {
    // 강력한 시크릿 키 생성 (프로덕션에서는 환경변수 사용)
    secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'maekcord-api',
    audience: 'maekcord-client'
  },

  // 비밀번호 설정
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    saltRounds: 12
  },

  // Rate Limiting 설정
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // IP당 최대 요청 수
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    standardHeaders: true,
    legacyHeaders: false
  },

  // CORS 설정
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // Helmet 보안 헤더 설정
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },

  // 세션 설정
  session: {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24시간
    }
  },

  // 암호화 설정
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16
  },

  // 로그인 시도 제한
  loginAttempts: {
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15분
    resetAttemptsAfter: 60 * 60 * 1000 // 1시간
  },

  // API 키 설정
  apiKey: {
    enabled: process.env.ENABLE_API_KEY === 'true',
    headerName: 'X-API-Key',
    keyLength: 32
  },

  // 파일 업로드 보안
  fileUpload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ],
    uploadDir: './uploads',
    tempDir: './temp'
  },

  // 데이터베이스 보안
  database: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    charset: 'utf8mb4'
  },

  // 감사 로그 설정
  audit: {
    enabled: true,
    logLevel: 'info',
    sensitiveFields: ['password', 'token', 'secret', 'authorization'],
    excludePaths: ['/health', '/api-docs']
  }
};

// 보안 유틸리티 함수들
const securityUtils = {
  // 강력한 랜덤 문자열 생성
  generateSecureToken: (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
  },

  // 비밀번호 해시 생성
  hashPassword: async (password) => {
    const bcrypt = require('bcryptjs');
    return await bcrypt.hash(password, securityConfig.password.saltRounds);
  },

  // 비밀번호 검증
  verifyPassword: async (password, hash) => {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, hash);
  },

  // 데이터 암호화
  encryptData: (data, key) => {
    const iv = crypto.randomBytes(securityConfig.encryption.ivLength);
    const cipher = crypto.createCipher(securityConfig.encryption.algorithm, key);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex')
    };
  },

  // 데이터 복호화
  decryptData: (encryptedData, key, iv, tag) => {
    const decipher = crypto.createDecipher(securityConfig.encryption.algorithm, key);
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  },

  // 민감한 데이터 마스킹
  maskSensitiveData: (data, fields = securityConfig.audit.sensitiveFields) => {
    const masked = { ...data };
    
    fields.forEach(field => {
      if (masked[field]) {
        masked[field] = '***MASKED***';
      }
    });
    
    return masked;
  },

  // IP 주소 검증
  isValidIP: (ip) => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  },

  // 파일 확장자 검증
  isValidFileExtension: (filename, allowedExtensions) => {
    const ext = filename.toLowerCase().split('.').pop();
    return allowedExtensions.includes(ext);
  },

  // SQL 인젝션 방지 (기본적인 검증)
  sanitizeSQL: (input) => {
    if (typeof input !== 'string') return input;
    
    // 위험한 SQL 키워드 제거
    const dangerousKeywords = [
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
      'UNION', 'EXEC', 'EXECUTE', 'SCRIPT', 'EVAL', 'FUNCTION'
    ];
    
    let sanitized = input;
    dangerousKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      sanitized = sanitized.replace(regex, '');
    });
    
    return sanitized;
  },

  // XSS 방지
  sanitizeHTML: (input) => {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
};

module.exports = {
  securityConfig,
  securityUtils
};
