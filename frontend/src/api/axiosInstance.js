// src/api/axiosInstance.js
import axios from 'axios';

// default export로 변경
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 에러 핸들링 인터셉터 추가
api.interceptors.request.use(
  config => {
    console.log('요청 설정:', config);
    return config;
  },
  error => {
    console.error('요청 에러:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    console.log('응답:', response);
    return response;
  },
  error => {
    console.error('응답 에러:', error);
    return Promise.reject(error);
  }
);

export default api;  // default export로 변경
