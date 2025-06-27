// src/api/axiosInstance.js
import axios from 'axios';
import { getSecurityHeaders, secureLogout } from '../utils/security';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  (config) => {
    // 보안 헤더 추가
    const securityHeaders = getSecurityHeaders();
    config.headers = { ...config.headers, ...securityHeaders };
    
    console.log('📤 API 요청:', {
      method: config.method,
      url: config.url,
      data: config.data,
      params: config.params
    });
    
    return config;
  },
  (error) => {
    console.error('❌ API 요청 실패:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('📥 API 응답:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API 응답 실패:', {
      message: error.message,
      response: error.response?.data
    });
    
    // 토큰 만료 또는 인증 오류 처리
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('🔐 인증 토큰이 만료되었습니다. 로그인 페이지로 이동합니다.');
      
      // 보안 정리
      secureLogout();
      
      // 로그인 페이지로 리다이렉트 (현재 페이지가 로그인 페이지가 아닌 경우에만)
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

export const getCurrentPatient = async () => {
  try {
    const response = await axiosInstance.get('/api/queue/current-patient');
    return response.data;
  } catch (error) {
    console.error('현재 진료 환자 조회 실패:', error);
    throw error;
  }
};
