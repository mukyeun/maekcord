import { createSlice } from '@reduxjs/toolkit';
import { fetchQueueData } from '../thunks/queueThunks';

const initialState = {
  queue: [],
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
      state.queue = action.payload;
    },
    fetchQueueFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setCurrentQueuePatient: (state, action) => {
      state.currentPatient = action.payload;
    },
    addToQueue: (state, action) => {
      state.queue.push(action.payload);
    },
    updateQueueItem: (state, action) => {
      const index = state.queue.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.queue[index] = action.payload;
      }
    },
    removeFromQueue: (state, action) => {
      state.queue = state.queue.filter(item => item.id !== action.payload);
      if (state.currentPatient?.id === action.payload) {
        state.currentPatient = null;
      }
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
        state.queue = action.payload;
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
  setCurrentQueuePatient,
  addToQueue,
  updateQueueItem,
  removeFromQueue
} = queueSlice.actions;

export default queueSlice.reducer; 