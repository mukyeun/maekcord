import api from './axiosInstance';

// 클라이언트-서버 상태값 매핑
const STATUS_MAP = {
  waiting: 'waiting',
  called: 'called',
  consulting: 'in-progress',
  done: 'done'
};

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

  // 대기 등록
  createQueue: async (patientData) => {
    try {
      console.log('🔄 대기 등록 시작:', patientData);
      const response = await api.post('/api/queues', patientData);
      console.log('✅ 대기 등록 완료:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 대기 등록 실패:', error);
      throw error;
    }
  },

  // 환자 호출
  callPatient: async (queueId) => {
    try {
      console.log('🔄 환자 호출 시작:', queueId);
      const response = await api.put(`/api/queues/${queueId}/call`);
      console.log('✅ 환자 호출 완료:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 환자 호출 실패:', error);
      throw error;
    }
  },

  // 상태 업데이트
  updateStatus: async (queueId, status) => {
    try {
      const apiStatus = STATUS_MAP[status] || status;
      console.log('🔄 상태 업데이트 시작:', { queueId, clientStatus: status, apiStatus });
      
      const response = await api.put(`/api/queues/${queueId}/status`, { 
        status: apiStatus 
      });
      
      console.log('✅ 상태 업데이트 완료:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 상태 업데이트 실패:', error);
      throw error;
    }
  },

  // 대기 삭제
  deleteQueue: async (queueId) => {
    try {
      console.log('🔄 대기 삭제 시작:', queueId);
      const response = await api.delete(`/api/queues/${queueId}`);
      console.log('✅ 대기 삭제 완료');
      return response.data;
    } catch (error) {
      console.error('❌ 대기 삭제 실패:', error);
      throw error;
    }
  }
};

export default queueApi;