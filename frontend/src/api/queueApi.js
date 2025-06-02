import api from './axiosInstance';

// 대기 목록 조회
export const getQueueList = async () => {
  try {
    const response = await api.get('/api/queues');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch queue list:', error);
    throw error;
  }
};

// 현재 진료중인 환자 조회
export const getCurrentPatient = async () => {
  try {
    // 대기 목록을 가져와서 CALLED 또는 CONSULTING 상태인 첫 번째 환자를 찾음
    const response = await api.get('/api/queues');
    const patients = response.data.items || [];
    const currentPatient = patients.find(p => 
      p.status === 'CALLED' || p.status === 'CONSULTING'
    );

    return {
      success: true,
      data: currentPatient || null
    };
  } catch (error) {
    console.error('현재 환자 조회 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 대기 상태 업데이트
export const updateQueueStatus = async (queueId, newStatus) => {
  try {
    const response = await api.patch(`/api/queues/${queueId}/status`, {
      status: newStatus
    });
    return response.data;
  } catch (error) {
    console.error('Failed to update queue status:', error);
    throw error;
  }
};

// 새 환자 대기 등록
export const addToQueue = async (patientData) => {
  try {
    const response = await api.post('/api/queues', patientData);
    return response.data;
  } catch (error) {
    console.error('대기 등록 실패:', error);
    throw error;
  }
};

// 대기 취소
export const removeFromQueue = async (queueId) => {
  try {
    const response = await api.delete(`/api/queues/${queueId}`);
    return response.data;
  } catch (error) {
    console.error('대기 취소 실패:', error);
    throw error;
  }
};