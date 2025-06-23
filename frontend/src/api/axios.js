import axios from 'axios';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('🔐 인증 토큰이 만료되었습니다. 로그인 페이지로 이동합니다.');
      
      // 토큰 제거
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 로그인 페이지로 리다이렉트 (현재 페이지가 로그인 페이지가 아닌 경우에만)
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api; 