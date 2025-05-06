import { medicalAPI } from '../../api/medical';

// 진료 기록 생성
export const createMedicalRecord = (patientId, recordData) => async () => {
  try {
    const data = await medicalAPI.createMedicalRecord(patientId, recordData);
    return data;
  } catch (error) {
    throw error;
  }
};

// 진료 기록 조회
export const fetchMedicalRecord = (recordId) => async () => {
  try {
    const data = await medicalAPI.getMedicalRecord(recordId);
    return data;
  } catch (error) {
    throw error;
  }
};

// 진료 기록 수정
export const updateMedicalRecord = (recordId, recordData) => async () => {
  try {
    const data = await medicalAPI.updateMedicalRecord(recordId, recordData);
    return data;
  } catch (error) {
    throw error;
  }
};

// 환자의 전체 진료 기록 조회
export const fetchPatientMedicalHistory = (patientId) => async () => {
  try {
    const data = await medicalAPI.getPatientMedicalHistory(patientId);
    return data;
  } catch (error) {
    throw error;
  }
};

// 오늘의 진료 기록 목록 조회
export const fetchTodayRecords = () => async () => {
  try {
    const data = await medicalAPI.getTodayRecords();
    return data;
  } catch (error) {
    throw error;
  }
}; 