// src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📤 API 요청:', {
      method: config.method,
      url: config.url,
      data: config.data,
      headers: config.headers
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
      
      // 로컬 스토리지 정리
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
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
    const response = await axiosInstance.get('/queue/current-patient');
    return response.data;
  } catch (error) {
    console.error('현재 진료 환자 조회 실패:', error);
    throw error;
  }
};