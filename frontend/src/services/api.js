import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// API 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 대기열 관련 API
export const getTodayQueues = async () => {
  try {
    const response = await apiClient.get('/queues/today');
    return response.data;
  } catch (error) {
    console.error('오늘 대기열 조회 실패:', error);
    throw error;
  }
};

export const callPatient = async (queueId) => {
  try {
    const response = await apiClient.post(`/queues/${queueId}/call`);
    return response.data;
  } catch (error) {
    console.error('환자 호출 실패:', error);
    throw error;
  }
};

export const updateQueueStatus = async (queueId, status) => {
  try {
    const response = await apiClient.put(`/queues/${queueId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('대기 상태 변경 실패:', error);
    throw error;
  }
};

// 환자 관련 API
export const createPatient = async (patientData) => {
  try {
    const response = await apiClient.post('/patients', patientData);
    return response.data;
  } catch (error) {
    console.error('환자 등록 실패:', error);
    throw error;
  }
};

export const getPatients = async (params = {}) => {
  try {
    const response = await apiClient.get('/patients', { params });
    return response.data;
  } catch (error) {
    console.error('환자 목록 조회 실패:', error);
    throw error;
  }
};

// 맥박 관련 API
export const savePulseData = async (pulseData) => {
  try {
    const response = await apiClient.post('/pulse', pulseData);
    return response.data;
  } catch (error) {
    console.error('맥박 데이터 저장 실패:', error);
    throw error;
  }
};

export const getPulseAnalysis = async (patientId) => {
  try {
    const response = await apiClient.get(`/pulse/${patientId}`);
    return response.data;
  } catch (error) {
    console.error('맥박 분석 조회 실패:', error);
    throw error;
  }
};

// 인증 관련 API
export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    console.error('로그인 실패:', error);
    throw error;
  }
};

export const refreshToken = async () => {
  try {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    throw error;
  }
};

export default apiClient; 