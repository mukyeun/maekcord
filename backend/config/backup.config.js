const path = require('path');

module.exports = {
  // 백업 저장 경로
  backupPath: path.join(__dirname, '../backups'),
  
  // 백업 주기 설정
  schedule: {
    daily: '0 0 * * *',      // 매일 자정
    weekly: '0 0 * * 0',     // 매주 일요일 자정
    monthly: '0 0 1 * *'     // 매월 1일 자정
  },
  
  // 백업 보관 기간
  retention: {
    daily: 7,    // 일간 백업 7일 보관
    weekly: 4,   // 주간 백업 4주 보관
    monthly: 12  // 월간 백업 12개월 보관
  },
  
  // 백업 파일 이름 형식
  fileNameFormat: {
    daily: 'daily-backup-YYYY-MM-DD',
    weekly: 'weekly-backup-YYYY-MM-DD',
    monthly: 'monthly-backup-YYYY-MM'
  },
  
  // 압축 설정
  compression: {
    enabled: true,
    level: 9  // 최대 압축
  },

  // 백업 기본 설정
  backup: {
    // 백업 저장 경로
    path: '../backups',
    
    // 백업 파일 이름 형식
    fileFormat: 'backup_%DATE%',
    
    // 백업 주기 설정 (cron 형식)
    schedule: '0 3 * * *',  // 매일 새벽 3시
    
    // 백업 보관 기간 (일)
    retentionPeriod: 30,
    
    // MongoDB 백업 설정
    mongodb: {
      // 백업할 컬렉션들
      collections: ['users', 'patients', 'measurements'],
      
      // 압축 사용
      compress: true,
      
      // 백업 전 검증 수행
      validateBeforeBackup: true
    },
    
    // 알림 설정
    notifications: {
      // 백업 성공/실패 시 관리자에게 알림
      enabled: true,
      email: 'admin@test.com'
    }
  }
}; 