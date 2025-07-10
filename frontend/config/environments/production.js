// 프로덕션 환경 설정
const productionConfig = {
  // 환경 정보
  env: 'production',
  debug: false,
  
  // API 설정
  api: {
    baseURL: 'https://api.maekcode.com/api',
    timeout: 15000,
    retryAttempts: 5,
  },
  
  // WebSocket 설정
  websocket: {
    url: 'wss://api.maekcode.com/ws',
    reconnectInterval: 3000,
    maxReconnectAttempts: 20,
  },
  
  // 보안 설정
  security: {
    jwtSecret: process.env.REACT_APP_JWT_SECRET || 'prod_jwt_secret_key_2024',
    cspNonce: process.env.REACT_APP_CSP_NONCE || 'prod_csp_nonce_2024',
    tokenExpiry: 2 * 60 * 60 * 1000, // 2시간
    refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7일
  },
  
  // 성능 모니터링
  performance: {
    monitoring: true,
    errorTracking: true,
    logLevel: 'error',
    enableConsoleLog: false,
  },
  
  // 테스트 설정
  testing: {
    mockApi: false,
    testMode: false,
    mockData: false,
  },
  
  // 기능 플래그
  features: {
    realtimeUpdates: true,
    offlineMode: true,
    pushNotifications: true,
    analytics: true,
  },
  
  // 개발 도구
  devTools: {
    reduxDevTools: false,
    reactDevTools: false,
    performanceProfiler: false,
  },
  
  // 캐싱 설정
  caching: {
    enableServiceWorker: true,
    cacheStrategy: 'network-first',
    maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7일
  },
  
  // CDN 설정
  cdn: {
    enabled: true,
    baseURL: 'https://cdn.maekcode.com',
  },
};

export default productionConfig; 