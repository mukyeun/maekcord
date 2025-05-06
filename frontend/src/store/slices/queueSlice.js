import { createSlice } from '@reduxjs/toolkit';
import { fetchQueueData } from '../thunks/queueThunks';

const initialState = {
  waitingList: [],
  currentPatient: null,
  loading: false,
  error: null
};

const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    fetchQueueStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchQueueSuccess: (state, action) => {
      state.loading = false;
      state.waitingList = action.payload;
    },
    fetchQueueFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    addToQueue: (state, action) => {
      state.waitingList.push(action.payload);
    },
    removeFromQueue: (state, action) => {
      state.waitingList = state.waitingList.filter(p => p.id !== action.payload);
    },
    setCurrentPatient: (state, action) => {
      state.currentPatient = action.payload;
    },
    clearCurrentPatient: (state) => {
      state.currentPatient = null;
    },
    updateQueueOrder: (state, action) => {
      state.waitingList = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQueueData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQueueData.fulfilled, (state, action) => {
        state.loading = false;
        state.waitingList = action.payload;
      })
      .addCase(fetchQueueData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const {
  fetchQueueStart,
  fetchQueueSuccess,
  fetchQueueFailure,
  addToQueue,
  removeFromQueue,
  setCurrentPatient,
  clearCurrentPatient,
  updateQueueOrder
} = queueSlice.actions;

export default queueSlice.reducer; 