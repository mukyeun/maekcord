import axiosInstance from './axiosInstance';

export const login = async (email, password) => {
  const response = await axiosInstance.post('/auth/login', { email, password });
  return response.data.data; // data.data를 반환하여 token과 user를 직접 받을 수 있도록 함
};
