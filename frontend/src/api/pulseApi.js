import axiosInstance from './axiosInstance';

const BASE_URL = '/api/pulse-map';

export const getPulseProfileByName = async (pulseName) => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/profile/${pulseName}`);
    return response.data;
  } catch (error) {
    console.error(`맥상 프로파일(${pulseName}) 조회 실패:`, error.response?.data || error.message);
    throw error;
  }
}; 