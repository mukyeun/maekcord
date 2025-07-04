import axiosInstance from './axiosInstance';
import { handleResponse, handleError } from './apiUtils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Seoul');

const BASE_URL = '/api/queues';

/**
 * 대기열 등록 API
 * @param {Object} queueData - 대기열 등록 데이터
 * @returns {Promise<Object>} 등록 결과
 */
export const registerQueue = async (queueData) => {
  try {
    console.log('🎫 대기열 등록 시작:', queueData);

    if (!queueData.patientId) {
      throw new Error('환자 ID가 필요합니다.');
    }

    const requestData = {
      patientId: queueData.patientId,
      visitType: queueData.visitType || '초진',
      symptoms: Array.isArray(queueData.symptoms) ? queueData.symptoms : [],
      status: queueData.status || 'waiting',
      registeredAt: new Date().toISOString(),
      date: queueData.date, // 문자열 그대로!
      priority: queueData.priority || 0,
      memo: queueData.memo || '',
      isTest: queueData.isTest || false,
      forceCreate: queueData.forceCreate || false
    };

    console.log('🚀 서버로 보내는 데이터:', requestData);

    const response = await axiosInstance.post(BASE_URL, requestData);
    console.log('✅ 서버 응답:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ 대기열 등록 실패:', error.response || error);
    throw new Error(error.response?.data?.message || '대기열 등록 중 오류가 발생했습니다.');
  }
};

/**
 * 전체 대기 목록 조회
 */
export const getQueueList = async () => {
  try {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  } catch (error) {
    console.error('❌ 대기 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * 오늘 대기 목록 조회
 */
export const getTodayQueueList = async () => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/today`);
    return response.data;
  } catch (error) {
    console.error('❌ 오늘의 대기 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * 환자 호출
 */
export const callPatient = async (queueId) => {
  return await axiosInstance.put(`/api/queues/${queueId}/call`, {
    changedBy: 'reception',
    previousStatus: 'waiting',
    newStatus: 'called',
  });
};

/**
 * 대기 상태 변경
 */
export const updateQueueStatus = async (queueId, status, symptoms, memo, stress, pulseAnalysis) => {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/${queueId}/status`, {
      status,
      symptoms: symptoms || [],
      memo: memo || '',
      stress: stress || '',
      pulseAnalysis: pulseAnalysis || ''
    });
    return response.data;
  } catch (error) {
    console.error('상태 업데이트 실패:', error);
    throw new Error('상태 변경 중 오류가 발생했습니다.');
  }
};

/**
 * 대기 삭제
 */
export const deleteQueue = async (queueId) => {
  try {
    console.log('🗑️ 대기열 삭제 요청:', queueId);
    
    const response = await axiosInstance.delete(`${BASE_URL}/${queueId}`);
    
    console.log('✅ 대기열 삭제 완료:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 대기열 삭제 실패:', error);
    throw new Error(error.response?.data?.message || '대기열 삭제 중 오류가 발생했습니다.');
  }
};

/**
 * 테스트 데이터 조회
 */
export const testQueueList = async () => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/test`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || '테스트 목록 조회 오류');
  }
};

/**
 * 테스트 데이터 생성
 */
export const createTestData = async () => {
  try {
    const response = await axiosInstance.post(`${BASE_URL}/test-data`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || '테스트 데이터 생성 오류');
  }
};

/**
 * 디버깅 정보 조회
 */
export const getDebugInfo = async () => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/debug`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || '디버깅 정보 조회 오류');
  }
};

/**
 * 환자의 대기열 상태 조회
 * @param {string} patientId - 환자 ID
 * @param {string} date - 날짜 (YYYY-MM-DD)
 * @returns {Promise<Object>} 대기 상태 정보
 */
export const getQueueStatus = async (patientId, date) => {
  try {
    console.log('🔍 대기상태 조회 요청:', { patientId, date });
    
    const response = await axiosInstance.post(`${BASE_URL}/status`, {
      patientId,
      date
    });

    console.log('✅ 대기상태 조회 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 대기상태 조회 실패:', error);
    throw new Error(error.response?.data?.message || '대기상태 조회 중 오류가 발생했습니다.');
  }
};

// 현재 진료 중인 환자 조회
export const getCurrentPatient = async () => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/current-patient`);
    return response.data;
  } catch (error) {
    console.error('현재 진료 환자 조회 실패:', error);
    
    // 404 에러인 경우 정상적인 응답으로 처리
    if (error.response?.status === 404) {
      return {
        success: true,
        data: null,
        message: '현재 진료 중인 환자가 없습니다.'
      };
    }
    
    throw error;
  }
};

/**
 * 다음 환자 호출
 */
export const callNextPatient = async () => {
  try {
    const response = await axiosInstance.post(`${BASE_URL}/next`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || '다음 환자 호출 중 오류가 발생했습니다.');
  }
};

export const saveNote = async (queueId, noteData) => {
  try {
    // noteData에는 { symptoms, memo, stress, pulseAnalysis } 등이 포함됩니다.
    const response = await axiosInstance.put(`${BASE_URL}/${queueId}/note`, noteData);
    return response.data;
  } catch (error)    {
    console.error(`진단 내용 저장 실패 (ID: ${queueId}):`, error.response?.data || error.message);
    throw error;
  }
};

export default {
  getQueueList,
  getTodayQueueList,
  registerQueue,
  callPatient,
  updateQueueStatus,
  deleteQueue,
  testQueueList,
  createTestData,
  getDebugInfo,
  getQueueStatus,
  getCurrentPatient,
  callNextPatient,
  saveNote
};
