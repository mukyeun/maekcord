import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import patientReducer from './slices/patientSlice';
import queueReducer from './slices/queueSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patient: patientReducer,
    queue: queueReducer,
  },
}); 