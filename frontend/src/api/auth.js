import api from './axios';

export const authAPI = {
  // 로그인
  login: async (credentials) => {
    // username을 email로 변환
    const loginData = {
      email: credentials.username,
      password: credentials.password
    };
    const response = await api.post('/auth/login', loginData);
    return response.data;
  },

  // 로그아웃
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // 현재 사용자 정보 조회
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // 비밀번호 변경
  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  }
}; 