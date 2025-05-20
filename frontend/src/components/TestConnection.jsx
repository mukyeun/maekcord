import React from 'react';
import { api } from '../api/axiosInstance';

const TestConnection = () => {
  const testApi = async () => {
    try {
      const response = await api.get('/api/test');
      console.log('API 테스트 성공:', response.data);
    } catch (error) {
      console.error('API 테스트 실패:', error);
    }
  };

  return (
    <button onClick={testApi}>
      API 연결 테스트
    </button>
  );
};

export default TestConnection; 