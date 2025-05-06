import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mockPatients } from '../../mocks/mockData';

// Async thunk actions
export const fetchPatientDetails = createAsyncThunk(
  'patient/fetchDetails',
  async (patientId) => {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const patient = mockPatients.find(p => p.id === Number(patientId));
    if (!patient) {
      throw new Error('환자를 찾을 수 없습니다.');
    }
    return patient;
  }
);

const initialState = {
  patients: [],
  currentPatient: null,
  loading: false,
  error: null
};

const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {
    fetchPatientsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchPatientsSuccess: (state, action) => {
      state.loading = false;
      state.patients = action.payload;
    },
    fetchPatientsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setCurrentPatient: (state, action) => {
      state.currentPatient = action.payload;
      state.loading = false;
    },
    clearCurrentPatient: (state) => {
      state.currentPatient = null;
    },
    addPatient: (state, action) => {
      state.patients.push(action.payload);
    },
    updatePatient: (state, action) => {
      const index = state.patients.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.patients[index] = action.payload;
      }
    },
    removePatient: (state, action) => {
      state.patients = state.patients.filter(p => p.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatientDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPatient = action.payload;
      })
      .addCase(fetchPatientDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const {
  fetchPatientsStart,
  fetchPatientsSuccess,
  fetchPatientsFailure,
  setCurrentPatient,
  clearCurrentPatient,
  addPatient,
  updatePatient,
  removePatient
} = patientSlice.actions;

export default patientSlice.reducer; 