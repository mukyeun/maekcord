import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const getPulseProfileByName = (pulseName) => {
  return api.get(`/pulse/info/${pulseName}`);
};

export const getPulseList = () => {
  return api.get('/pulse/list');
};

export const searchPulses = (query) => {
  return api.get(`/pulse/search?query=${query}`);
};

// 맥파 매개변수 평균값 조회
export const getPulseParameterAverages = async () => {
  try {
    const response = await api.get('/pulse/averages');
    return response.data;
  } catch (error) {
    console.error('맥파 매개변수 평균값 조회 실패:', error);
    throw error;
  }
}; 