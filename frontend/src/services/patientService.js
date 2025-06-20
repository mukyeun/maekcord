import { api } from '../api/axiosInstance';

export const savePatientInfo = async (patientData) => {
  return api.post('/api/patients/register', patientData);
}; 