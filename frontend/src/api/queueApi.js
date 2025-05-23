import api from './axiosInstance';

export const queueApi = {
  // 대기 목록 조회
  getQueue: async () => {
    try {
      console.log('🔄 대기 목록 조회 시작');
      const response = await api.get('/api/queues');
      console.log('✅ 대기 목록 조회 완료:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 대기 목록 조회 실패:', error);
      throw error;
    }
  },

  // 환자 호출
  callPatient: async (queueId) => {
    try {
      console.log('🔄 환자 호출 시작:', queueId);
      if (!queueId) throw new Error('Queue ID is required');
      
      // ID 추출 (객체나 문자열 모두 처리)
      const id = typeof queueId === 'object' ? queueId._id : queueId;
      
      const response = await api.put(`/api/queues/${id}/call`);
      console.log('✅ 환자 호출 완료:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 환자 호출 실패:', error);
      throw error;
    }
  },

  // 상태 업데이트 (ID 확인 추가)
  updateStatus: async (queueId, status) => {
    try {
      console.log('🔄 상태 업데이트 시작:', { queueId, status });
      if (!queueId) throw new Error('Queue ID is required');
      const id = typeof queueId === 'object' ? queueId._id : queueId;
      const response = await api.put(`/api/queues/${id}/status`, { status });
      console.log('✅ 상태 업데이트 완료:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 상태 업데이트 실패:', error);
      throw error;
    }
  },

  // 대기 목록에 환자 추가
  addToQueue: async (patientData) => {
    try {
      console.log('🔄 대기 목록 추가 시작:', patientData);
      const response = await api.post('/api/queues', patientData);
      console.log('✅ 대기 목록 추가 완료:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 대기 목록 추가 실패:', error);
      throw error;
    }
  },

  // 대기 삭제 API
  deleteQueue: async (queueId) => {
    try {
      console.log('🗑️ 대기 삭제 시도:', queueId);
      
      // ID 추출 (객체나 문자열 모두 처리)
      const id = typeof queueId === 'object' ? queueId._id : queueId;
      
      const response = await api.delete(`/api/queues/${id}`);
      console.log('✅ 대기 삭제 완료:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ 대기 삭제 실패:', error);
      throw error;
    }
  }
};

export default queueApi;