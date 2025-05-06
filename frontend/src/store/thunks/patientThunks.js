import { createAsyncThunk } from '@reduxjs/toolkit';
import { mockPatients } from '../../mocks/mockData';
import {
  fetchPatientsStart,
  fetchPatientsSuccess,
  fetchPatientsFailure,
  setCurrentPatient,
  addPatient,
  updatePatient,
  removePatient
} from '../slices/patientSlice';

// Mock API 함수들
const mockPatientAPI = {
  getPatients: () => new Promise((resolve) => {
    setTimeout(() => resolve(mockPatients), 500);
  }),
  createPatient: (data) => new Promise((resolve) => {
    setTimeout(() => resolve({ ...data, id: Date.now() }), 500);
  }),
  updatePatient: (id, data) => new Promise((resolve) => {
    setTimeout(() => resolve({ ...data, id }), 500);
  }),
  deletePatient: (id) => new Promise((resolve) => {
    setTimeout(() => resolve(true), 500);
  }),
  getPatientById: (id) => new Promise((resolve) => {
    setTimeout(() => resolve(mockPatients.find(p => p.id === id)), 500);
  })
};

export const fetchPatients = () => async (dispatch) => {
  try {
    dispatch(fetchPatientsStart());
    const data = await mockPatientAPI.getPatients();
    dispatch(fetchPatientsSuccess(data));
    return data;
  } catch (error) {
    dispatch(fetchPatientsFailure(error.message));
    throw error;
  }
};

export const createNewPatient = (patientData) => async (dispatch) => {
  try {
    const data = await mockPatientAPI.createPatient(patientData);
    dispatch(addPatient(data));
    return data;
  } catch (error) {
    throw error;
  }
};

export const updatePatientInfo = (id, patientData) => async (dispatch) => {
  try {
    const data = await mockPatientAPI.updatePatient(id, patientData);
    dispatch(updatePatient(data));
    return data;
  } catch (error) {
    throw error;
  }
};

export const deletePatient = (id) => async (dispatch) => {
  try {
    await mockPatientAPI.deletePatient(id);
    dispatch(removePatient(id));
  } catch (error) {
    throw error;
  }
};

export const fetchPatientDetails = (id) => async (dispatch) => {
  try {
    const data = await mockPatientAPI.getPatientById(id);
    dispatch(setCurrentPatient(data));
    return data;
  } catch (error) {
    throw error;
  }
}; 