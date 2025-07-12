const config = {
  // API 엔드포인트
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  
  // WebSocket 엔드포인트
  wsUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:3000',
  
  // 인증 관련
  auth: {
    tokenKey: 'maekcode_token',
    refreshTokenKey: 'maekcode_refresh_token',
    userKey: 'maekcode_user'
  },
  
  // WebSocket 설정
  websocket: {
    reconnectAttempts: 5,
    reconnectDelay: 1000,
    heartbeatInterval: 15000,
    heartbeatTimeout: 30000
  },
  
  // 알림 설정
  notification: {
    maxNotifications: 100,
    defaultExpireTime: 30 * 24 * 60 * 60 * 1000, // 30일
    refreshInterval: 60000, // 1분
    sound: {
      enabled: true,
      file: '/sounds/notification.mp3'
    }
  },
  
  // 캐시 설정
  cache: {
    maxAge: 5 * 60 * 1000, // 5분
    maxItems: 1000
  }
};

export default config; 