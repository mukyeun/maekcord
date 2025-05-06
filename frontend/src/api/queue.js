import api from './axios';

export const queueAPI = {
  // 전체 대기열 조회
  getQueue: async () => {
    const response = await api.get('/queue');
    return response.data;
  },

  // 대기열에 환자 추가
  addToQueue: async (patientData) => {
    const response = await api.post('/queue', patientData);
    return response.data;
  },

  // 대기열에서 환자 제거
  removeFromQueue: async (id) => {
    const response = await api.delete(`/queue/${id}`);
    return response.data;
  },

  // 현재 진료중인 환자 조회
  getCurrentPatient: async () => {
    const response = await api.get('/queue/current');
    return response.data;
  },

  // 다음 환자 호출
  callNextPatient: async () => {
    const response = await api.post('/queue/next');
    return response.data;
  },

  // 대기 순서 변경
  updateQueueOrder: async (queueOrder) => {
    const response = await api.put('/queue/order', queueOrder);
    return response.data;
  },

  // 진료실별 대기 현황
  getRoomStatus: async () => {
    const response = await api.get('/queue/rooms');
    return response.data;
  }
}; 