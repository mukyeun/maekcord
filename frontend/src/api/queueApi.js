import axiosInstance from './axiosInstance';

// 대기 목록 조회
export const getQueueList = async () => {
  try {
    const response = await axiosInstance.get('/api/queues');
    return response.data;
  } catch (error) {
    console.error('대기 목록 조회 실패:', error);
    throw error;
  }
};

// 현재 진료중인 환자 조회
export const getCurrentPatient = async () => {
  try {
    const response = await axiosInstance.get('/api/queues/current');
    return response.data;
  } catch (error) {
    console.error('현재 환자 조회 실패:', error);
    throw error;
  }
};

// 대기 상태 업데이트
export const updateQueueStatus = async (queueId, status) => {
  try {
    console.log('상태 업데이트 요청:', { queueId, status });
    
    const response = await axiosInstance.patch(`/api/queues/${queueId}`, {
      status: status.toUpperCase()
    });

    if (response.data.success === false) {
      throw new Error(response.data.message || '상태 업데이트 실패');
    }

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('상태 업데이트 실패:', error);
    throw error;
  }
};

// 새 환자 대기 등록
export const addToQueue = async (patientData) => {
  try {
    const response = await axiosInstance.post('/api/queues', patientData);
    return response.data;
  } catch (error) {
    console.error('대기 등록 실패:', error);
    throw error;
  }
};

// 대기 취소
export const removeFromQueue = async (queueId) => {
  try {
    const response = await axiosInstance.delete(`/api/queues/${queueId}`);
    return response.data;
  } catch (error) {
    console.error('대기 취소 실패:', error);
    throw error;
  }
};
