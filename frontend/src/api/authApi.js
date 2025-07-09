import axiosInstance from './axiosInstance';

export const login = async (email, password) => {
  const response = await axiosInstance.post('/api/auth/login', { email, password });
  // 응답 데이터 구조 확인 후 반환
  if (response.data.success) {
    return response.data.data;
  } else {
    throw new Error(response.data.message || '로그인에 실패했습니다.');
  }
};
