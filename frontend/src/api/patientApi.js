// src/api/patientApi.js
import api from './axiosInstance';

// 환자 등록 API
export const registerPatient = async (patientData) => {
  try {
    console.log('📝 환자 등록 요청:', patientData);
    const response = await api.post('/api/patients', patientData);
    console.log('✅ 환자 등록 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 환자 등록 실패:', error);
    throw error;
  }
};

// 환자 조회 API
export const getPatient = async (patientId) => {
  try {
    console.log('🔄 환자 조회 시도:', patientId);

    // ✅ /api 중복 제거
    const response = await api.get(`/patients/${patientId}`);
    console.log('✅ 환자 조회 완료:', response.data);

    return response.data;
  } catch (error) {
    console.error('❌ 환자 조회 실패:', error);
    throw error;
  }
};

export const getPatientList = async () => {
  try {
    console.log('📋 환자 목록 조회 요청');
    const response = await api.get('/api/patients');
    console.log('✅ 환자 목록 조회 응답:', response.data);
    
    // 응답 데이터가 배열이 아닌 경우 처리
    if (response.data && Array.isArray(response.data)) {
      return { success: true, data: response.data };
    } else if (response.data && Array.isArray(response.data.data)) {
      return { success: true, data: response.data.data };
    } else {
      console.warn('⚠️ 환자 목록 데이터 형식이 잘못됨:', response.data);
      return { success: true, data: [] };
    }
  } catch (error) {
    console.error('❌ 환자 목록 조회 실패:', error);
    return { success: false, data: [], error: error.message };
  }
};

// 전체 API 객체로 통합 export
export const patientApi = {
  registerPatient,
  getPatient,
  getPatientList,
};

export default patientApi;
