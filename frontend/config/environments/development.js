// 개발 환경 설정
const developmentConfig = {
  // 환경 정보
  env: 'development',
  debug: true,
  
  // API 설정
  api: {
    baseURL: 'http://localhost:3000/api',
    timeout: 10000,
    retryAttempts: 3,
  },
  
  // WebSocket 설정
  websocket: {
    url: 'ws://localhost:3000/ws',
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
  },
  
  // 보안 설정
  security: {
    jwtSecret: 'dev_jwt_secret_key_2024',
    cspNonce: 'dev_csp_nonce_2024',
    tokenExpiry: 24 * 60 * 60 * 1000, // 24시간
    refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7일
  },
  
  // 성능 모니터링
  performance: {
    monitoring: true,
    errorTracking: true,
    logLevel: 'debug',
    enableConsoleLog: true,
  },
  
  // 테스트 설정
  testing: {
    mockApi: true,
    testMode: false,
    mockData: true,
  },
  
  // 기능 플래그
  features: {
    realtimeUpdates: true,
    offlineMode: false,
    pushNotifications: false,
    analytics: false,
  },
  
  // 개발 도구
  devTools: {
    reduxDevTools: true,
    reactDevTools: true,
    performanceProfiler: true,
  },
};

export default developmentConfig; 