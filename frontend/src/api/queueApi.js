import api from './axiosInstance';

export const queueApi = {
  // 대기 목록 조회
  getQueue: async () => {
    try {
      console.log('대기 목록 조회 요청 시작');
      const response = await api.get('/api/queue');
      console.log('대기 목록 조회 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('대기 목록 조회 실패:', error);
      throw error;
    }
  },

  // 환자 호출
  callPatient: async (id) => {
    const response = await api.put(`/api/queue/${id}/call`);
    return response.data;
  },

  // 상태 업데이트
  updateStatus: async (id, status) => {
    const response = await api.put(`/api/queue/${id}/status`, { status });
    return response.data;
  },

  // 대기 목록에 환자 추가
  addToQueue: async (patientData) => {
    const response = await api.post('/api/queue', patientData);
    return response.data;
  }
};
