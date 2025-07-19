// 스테이징 환경 설정
const stagingConfig = {
  // 환경 정보
  env: 'staging',
  debug: true,
  
  // API 설정
  api: {
    baseURL: 'https://staging-api.maekcord.com/api',
    timeout: 12000,
    retryAttempts: 4,
  },
  
  // WebSocket 설정
  websocket: {
    url: 'wss://staging-api.maekcord.com/ws',
    reconnectInterval: 4000,
    maxReconnectAttempts: 15,
  },
  
  // 보안 설정
  security: {
    jwtSecret: process.env.REACT_APP_JWT_SECRET || 'staging_jwt_secret_key_2024',
    cspNonce: process.env.REACT_APP_CSP_NONCE || 'staging_csp_nonce_2024',
    tokenExpiry: 4 * 60 * 60 * 1000, // 4시간
    refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7일
  },
  
  // 성능 모니터링
  performance: {
    monitoring: true,
    errorTracking: true,
    logLevel: 'warn',
    enableConsoleLog: true,
  },
  
  // 테스트 설정
  testing: {
    mockApi: false,
    testMode: true,
    mockData: false,
  },
  
  // 기능 플래그
  features: {
    realtimeUpdates: true,
    offlineMode: true,
    pushNotifications: false,
    analytics: true,
  },
  
  // 개발 도구
  devTools: {
    reduxDevTools: true,
    reactDevTools: true,
    performanceProfiler: true,
  },
  
  // 캐싱 설정
  caching: {
    enableServiceWorker: false, // 서비스 워커 비활성화
    cacheStrategy: 'network-first',
    maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7일
  },
  
  // CDN 설정
  cdn: {
    enabled: true,
    baseURL: 'https://staging-cdn.maekcord.com',
  },
};

export default stagingConfig; 