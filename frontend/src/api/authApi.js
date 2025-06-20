import axiosInstance from './axiosInstance';

export const login = async (email, password) => {
  const response = await axiosInstance.post('/api/auth/login', { email, password });
  // 서버 응답 데이터는 response.data.data에 있습니다.
  return response.data.data;
};
