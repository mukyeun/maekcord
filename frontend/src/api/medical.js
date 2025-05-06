import api from './axios';

export const medicalAPI = {
  // 진료 기록 생성
  createMedicalRecord: async (patientId, recordData) => {
    const response = await api.post(`/medical-records/${patientId}`, recordData);
    return response.data;
  },

  // 진료 기록 조회
  getMedicalRecord: async (recordId) => {
    const response = await api.get(`/medical-records/${recordId}`);
    return response.data;
  },

  // 진료 기록 수정
  updateMedicalRecord: async (recordId, recordData) => {
    const response = await api.put(`/medical-records/${recordId}`, recordData);
    return response.data;
  },

  // 환자의 전체 진료 기록 조회
  getPatientMedicalHistory: async (patientId) => {
    const response = await api.get(`/medical-records/patient/${patientId}`);
    return response.data;
  },

  // 오늘의 진료 기록 목록
  getTodayRecords: async () => {
    const response = await api.get('/medical-records/today');
    return response.data;
  },

  // 처방전 생성
  createPrescription: async (recordId, prescriptionData) => {
    const response = await api.post(`/medical-records/${recordId}/prescription`, prescriptionData);
    return response.data;
  }
}; 