import { api } from '../api/axiosInstance';

export const savePatientInfo = async (patientData) => {
  try {
    const response = await api.post('/api/patients', patientData);
    return response.data;
  } catch (error) {
    console.error('환자 정보 저장 실패:', error);
    throw error;
  }
}; 