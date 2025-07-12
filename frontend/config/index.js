import developmentConfig from './environments/development';
import stagingConfig from './environments/staging';
import productionConfig from './environments/production';

// 환경별 설정 매핑
const configs = {
  development: developmentConfig,
  staging: stagingConfig,
  production: productionConfig,
};

// 현재 환경 결정
const getCurrentEnvironment = () => {
  // 환경 변수에서 환경 확인
  if (process.env.REACT_APP_ENV) {
    return process.env.REACT_APP_ENV;
  }
  
  // NODE_ENV 기반 환경 결정
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  if (process.env.NODE_ENV === 'test') {
    return 'development';
  }
  
  return 'development';
};

// 현재 환경 설정 가져오기
const getConfig = () => {
  const currentEnv = getCurrentEnvironment();
  const config = configs[currentEnv];
  
  if (!config) {
    console.warn(`환경 설정을 찾을 수 없습니다: ${currentEnv}`);
    return developmentConfig;
  }
  
  return config;
};

// 환경별 설정 내보내기
export const config = getConfig();
export const currentEnvironment = getCurrentEnvironment();

// 개별 설정 내보내기
export const apiConfig = config.api;
export const websocketConfig = config.websocket;
export const securityConfig = config.security;
export const performanceConfig = config.performance;
export const testingConfig = config.testing;
export const featuresConfig = config.features;
export const devToolsConfig = config.devTools;
export const cachingConfig = config.caching;
export const cdnConfig = config.cdn;

// 유틸리티 함수
export const isDevelopment = () => currentEnvironment === 'development';
export const isStaging = () => currentEnvironment === 'staging';
export const isProduction = () => currentEnvironment === 'production';
export const isTest = () => process.env.NODE_ENV === 'test';

// 환경 정보 로깅
if (config.debug) {
  console.log(`🚀 Maekcode Frontend - ${currentEnvironment.toUpperCase()} 환경`);
  console.log('📋 환경 설정:', {
    api: apiConfig.baseURL,
    websocket: websocketConfig.url,
    debug: config.debug,
    features: Object.keys(featuresConfig).filter(key => featuresConfig[key]),
  });
}

export default config; 