// src/api/axiosInstance.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // ✅ /api 포함
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 요청 인터셉터
api.interceptors.request.use(
  config => {
    console.log('📤 API 요청:', {
      method: config.method,
      url: config.baseURL + config.url,
      data: config.data
    });
    return config;
  },
  error => {
    console.error('❌ 요청 에러:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  response => {
    console.log('📥 API 응답:', response.data);
    return response;
  },
  error => {
    console.error('❌ 응답 에러:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
