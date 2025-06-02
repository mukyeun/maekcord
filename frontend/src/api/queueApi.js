import api from './axiosInstance';

// 클라이언트-서버 상태값 매핑
const STATUS_MAP = {
  waiting: 'waiting',
  called: 'called',
  consulting: 'in-progress',
  done: 'done'
};

// 대기 목록 전체 조회
export const getQueueList = async () => {
  try {
    console.log('📋 대기 목록 조회 시작');
    const response = await api.get('/queues');
    console.log('✅ 대기 목록 조회 성공:', response.data);
    return {
      success: true,
      data: response.data.data || []
    };
  } catch (error) {
    console.error('❌ 대기 목록 조회 실패:', error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

// 대기 등록 (환자 ID 필수)
export const addToQueue = async (patientId) => {
  try {
    console.log('📝 대기 등록 요청:', patientId);
    const response = await api.post('/queues', { patientId });
    console.log('✅ 대기 등록 성공:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ 대기 등록 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 환자 호출
export const callPatient = async (queueId) => {
  const response = await api.patch(`/queues/${queueId}/call`);  // 템플릿 리터럴 수정
  return response.data;
};

// 상태 업데이트
export const updateQueueStatus = async (queueId, status) => {
  try {
    console.log('📝 대기 상태 업데이트 요청:', { queueId, status });
    const response = await api.patch(`/queues/${queueId}/status`, { status });
    console.log('✅ 대기 상태 업데이트 성공:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ 대기 상태 업데이트 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 대기 삭제
export const deleteQueue = async (queueId) => {
  const response = await api.delete(`/queues/${queueId}`);  // 템플릿 리터럴 수정
  return response.data;
};

export default {
  getQueueList,
  addToQueue,
  callPatient,
  updateQueueStatus,
  deleteQueue
};
