import api from './axios';

export const patientAPI = {
  // 환자 목록 조회
  getPatients: async () => {
    const response = await api.get('/patients');
    return response.data;
  },

  // 환자 상세 정보 조회
  getPatientById: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  // 새 환자 등록
  createPatient: async (patientData) => {
    const response = await api.post('/patients', patientData);
    return response.data;
  },

  // 환자 정보 수정
  updatePatient: async (id, patientData) => {
    const response = await api.put(`/patients/${id}`, patientData);
    return response.data;
  },

  // 환자 삭제
  deletePatient: async (id) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },

  // 환자 진료 기록 조회
  getPatientMedicalRecords: async (id) => {
    const response = await api.get(`/patients/${id}/medical-records`);
    return response.data;
  }
}; 