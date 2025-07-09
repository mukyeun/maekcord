import axios from 'axios';
import { format } from 'date-fns';

const API_BASE_URL = '/api';

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
});

// 요청 인터셉터 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchAppointments = async (date) => {
  try {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const response = await api.get('/appointments', {
      params: { date: formattedDate }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
};

export const fetchDoctors = async () => {
  try {
    const response = await api.get('/doctors');  // /users 대신 /doctors 엔드포인트 사용
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
};

export const getAvailableSlots = async (date, doctorId) => {
  try {
    const response = await api.get('/appointments/available-slots', {
      params: { date, doctorId }
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const checkAppointmentOverlap = async (doctorId, dateTime, duration) => {
  try {
    const response = await api.post('/appointments/check-overlap', {
      doctorId,
      dateTime,
      duration
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createAppointment = async (appointmentData) => {
  try {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateAppointment = async (id, appointmentData) => {
  try {
    const response = await api.put(`/appointments/${id}`, appointmentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  const response = await api.put(`/appointments/${appointmentId}/status`, {
    status
  });
  return response.data.data;
};

export const cancelAppointment = async (id) => {
  try {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}; 