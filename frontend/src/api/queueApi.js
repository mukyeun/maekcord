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
    const response = await api.get('/api/queues');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch queue list:', error);
    throw error;
  }
};

// 대기 등록 (환자 ID 필수)
export const createQueue = async (data) => {
  // data must include: patientId, queueNumber, date
  const response = await api.post('/queues', data);
  return response.data;
};

// 환자 호출
export const callPatient = async (queueId) => {
  const response = await api.patch(`/queues/${queueId}/call`);  // 템플릿 리터럴 수정
  return response.data;
};

// 상태 업데이트
export const updateQueueStatus = async (queueId, status) => {
  try {
    const response = await api.patch(`/api/queues/${queueId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Failed to update queue status:', error);
    throw error;
  }
};

// 대기 삭제
export const deleteQueue = async (queueId) => {
  const response = await api.delete(`/queues/${queueId}`);  // 템플릿 리터럴 수정
  return response.data;
};

export default {
  getQueueList,
  createQueue,
  callPatient,
  updateQueueStatus,
  deleteQueue
};