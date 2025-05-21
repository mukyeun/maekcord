// src/api/patientApi.js
import api from './axiosInstance';

export const savePatientInfo = async (formData) => {
  try {
    console.log('📤 환자 정보 저장 요청:', formData);
    const response = await api.post('/api/patients', formData);
    console.log('📥 환자 정보 저장 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 환자 정보 저장 실패:', error);
    throw error;
  }
};
