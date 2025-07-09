const express = require('express');
const router = express.Router();
const { AppError } = require('../middlewares/errorHandler');
const {
  PatientNotFoundError,
  InvalidMedicalRecordError,
  UnauthorizedAccessError
} = require('../errors/domain.errors');

// 1. 일반적인 성공 응답 테스트
router.get('/success', (req, res) => {
  res.json({ success: true, message: '정상 작동 중입니다.' });
});

// 2. 의도적인 에러 발생 테스트
router.get('/error/:type', (req, res, next) => {
  const { type } = req.params;
  
  switch (type) {
    case 'operational':
      throw new AppError('의도적으로 발생시킨 운영 에러입니다.', 400, 'TEST_ERROR');
    
    case 'patient':
      throw new PatientNotFoundError('TEST-123');
    
    case 'medical':
      throw new InvalidMedicalRecordError('잘못된 진단 코드');
    
    case 'auth':
      throw new UnauthorizedAccessError();
    
    case 'database':
      // 몽구스 ValidationError 시뮬레이션
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      error.errors = {
        field1: { message: '필수 필드입니다.' },
        field2: { message: '유효하지 않은 값입니다.' }
      };
      throw error;
    
    case 'unhandled':
      // 처리되지 않은 에러 시뮬레이션
      throw new Error('처리되지 않은 서버 에러입니다.');
    
    default:
      throw new AppError('알 수 없는 에러 유형입니다.', 400, 'UNKNOWN_ERROR_TYPE');
  }
});

// 3. 느린 응답 테스트 (성능 모니터링용)
router.get('/slow', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 지연
  res.json({ success: true, message: '느린 응답 테스트 완료' });
});

// 4. 데이터베이스 작업 시뮬레이션
router.post('/db-operation', (req, res) => {
  const logger = require('../utils/logger');
  
  // 데이터베이스 작업 로깅 테스트
  logger.logDatabase('insert', 'patients', { name: 'Test Patient' }, 150);
  
  res.json({ success: true, message: '데이터베이스 작업 로깅 테스트 완료' });
});

// 5. 보안 이벤트 테스트
router.post('/security-event', (req, res) => {
  const logger = require('../utils/logger');
  
  // 보안 이벤트 로깅 테스트
  logger.logSecurity('invalid_access_attempt', {
    ip: req.ip,
    endpoint: '/restricted-area',
    reason: 'invalid_token'
  });
  
  res.json({ success: true, message: '보안 이벤트 로깅 테스트 완료' });
});

module.exports = router; 