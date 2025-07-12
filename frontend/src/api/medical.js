import api from './axiosInstance';

export const medicalAPI = {
  // 진료 기록 생성
  createMedicalRecord: async (patientId, recordData) => {
    try {
      const response = await api.post(`/api/medical-records/${patientId}`, recordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 진료 기록 조회
  getMedicalRecord: async (recordId) => {
    try {
      const response = await api.get(`/api/medical-records/${recordId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 진료 기록 수정
  updateMedicalRecord: async (recordId, recordData) => {
    try {
      const response = await api.put(`/api/medical-records/${recordId}`, recordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 환자의 전체 진료 기록 조회
  getPatientMedicalHistory: async (patientId) => {
    try {
      const response = await api.get(`/api/medical-records/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 오늘의 진료 기록 목록
  getTodayRecords: async () => {
    try {
      const response = await api.get('/api/medical-records/today');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 처방전 생성
  createPrescription: async (recordId, prescriptionData) => {
    try {
      const response = await api.post(`/api/medical-records/${recordId}/prescription`, prescriptionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 