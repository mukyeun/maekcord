import api from './axiosInstance';

// ✅ 환자 등록 (중복 체크 포함)
export const registerPatient = async (patientData) => {
  try {
    // 1. 주민번호로 기존 환자 체크
    const existingPatient = await api.post('/api/patients/check', {
      basicInfo: {
        residentNumber: patientData.basicInfo.residentNumber
      }
    });

    if (existingPatient.data.patientId) {
      return {
        success: false,
        message: '이미 등록된 환자입니다.',
        patientId: existingPatient.data.patientId
      };
    }

    // 2. 신규 환자 생성
    const response = await api.post('/api/patients/register', patientData);

    return {
      success: true,
      message: '환자가 등록되었습니다.',
      data: response.data
    };
  } catch (error) {
    console.error('❌ 환자 등록 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '환자 등록 중 오류가 발생했습니다.'
    };
  }
};

// ✅ 환자 정보 수정
export const updatePatient = async (patientId, patientData) => {
  try {
    const response = await api.put(`/api/patients/${patientId}`, patientData);
    return {
      success: true,
      message: '환자 정보가 업데이트되었습니다.',
      data: response.data
    };
  } catch (error) {
    console.error('환자 정보 업데이트 실패:', error);
    return {
      success: false,
      message: error.response?.data?.message || '환자 정보 업데이트 중 오류가 발생했습니다.'
    };
  }
};

// ✅ 환자 검색 (페이지네이션 포함)
export const searchPatient = async (searchParams) => {
  try {
    const response = await api.get('/api/patients/data', { 
      params: {
        search: searchParams.search,
        limit: searchParams.limit || 10,
        page: searchParams.page || 1,
        visitType: searchParams.visitType || '',
        status: searchParams.status || ''
      }
    });
    return response.data;
  } catch (error) {
    console.error('환자 검색 실패:', error);
    return {
      success: false,
      message: error.response?.data?.message || '환자 검색 중 오류가 발생했습니다.'
    };
  }
};

// ✅ 환자 상세 정보 조회
export const getPatientById = async (patientId) => {
  try {
    const response = await api.get(`/api/patients/${patientId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('환자 상세 조회 실패:', error);
    return {
      success: false,
      message: error.response?.data?.message || '환자 상세 조회 중 오류가 발생했습니다.'
    };
  }
};

// ✅ 환자 코드로 조회
export const findPatientByCode = async (patientCode) => {
  try {
    const response = await api.get(`/api/patients/code/${patientCode}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('환자 코드 조회 실패:', error);
    return {
      success: false,
      message: error.response?.data?.message || '환자 코드 조회 중 오류가 발생했습니다.'
    };
  }
};

// ✅ 환자 중복 체크 (별도 함수)
export const checkPatient = async (residentNumber) => {
  try {
    const response = await api.post('/api/patients/check', {
      basicInfo: {
        residentNumber
      }
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ 환자 중복 체크 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '환자 중복 체크 중 오류가 발생했습니다.'
    };
  }
};

// ✅ 환자 목록 조회 (간단한 목록)
export const getPatientList = async (params = {}) => {
  try {
    const response = await api.get('/api/patients', { params });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('환자 목록 조회 실패:', error);
    return {
      success: false,
      message: error.response?.data?.message || '환자 목록 조회 중 오류가 발생했습니다.'
    };
  }
};

// ✅ 대기열 등록
export const registerQueue = async (queueData) => {
  try {
    const response = await api.post('/api/queues', queueData);
    return response.data;
  } catch (error) {
    console.error('❌ 대기열 등록 API 오류:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.response?.data?.message === '이미 대기 중인 환자입니다.') {
      return {
        success: false,
        message: error.response.data.message,
        data: error.response.data.data,
        isExisting: true
      };
    }

    throw new Error(error.response?.data?.message || '대기열 등록 중 오류가 발생했습니다.');
  }
};

// ✅ 대기 상태 조회
export const getQueueStatus = async (patientId, date) => {
  try {
    const response = await api.get('/api/queues/status', {
      params: { patientId, date }
    });
    return response.data;
  } catch (error) {
    console.error('❌ 대기 상태 조회 실패:', error);
    throw new Error('대기 상태 조회 중 오류가 발생했습니다.');
  }
};

// ✅ 오늘 대기열 조회 (대기번호 생성용)
export const getTodayQueueList = async () => {
  try {
    const response = await api.get('/api/queues/today');
    return response.data;
  } catch (error) {
    console.error('❌ 오늘의 대기열 조회 실패:', error);
    return { success: false, data: [], message: '오늘 대기열 조회 중 오류 발생' };
  }
};
