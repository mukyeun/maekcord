// src/api/patientApi.js
import axiosInstance from './axiosInstance';

// 환자 등록 API
export const registerPatient = async (patientData) => {
  try {
    // 서버 전송 직전 데이터 확인용 로그
    console.log('🚀 서버 전송 직전 데이터:', {
      'basicInfo 존재 여부': !!patientData.basicInfo,
      'name 존재 여부': !!patientData.basicInfo?.name,
      'name 값': patientData.basicInfo?.name,
      '전체 구조': JSON.stringify(patientData, null, 2)
    });

    // ✅ /api 중복 제거
    const response = await axiosInstance.post('/patients/register', patientData);
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
    const response = await axiosInstance.get(`/patients/${patientId}`);
    console.log('✅ 환자 조회 완료:', response.data);

    return response.data;
  } catch (error) {
    console.error('❌ 환자 조회 실패:', error);
    throw error;
  }
};

// 전체 API 객체로 통합 export
export const patientApi = {
  registerPatient,
  getPatient,
};

export default patientApi;
