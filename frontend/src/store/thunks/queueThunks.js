import { createAsyncThunk } from '@reduxjs/toolkit';
import { mockQueue } from '../../mocks/mockData';
import {
  fetchQueueStart,
  fetchQueueSuccess,
  fetchQueueFailure,
  addToQueue,
  removeFromQueue,
  setCurrentQueuePatient,
  updateQueueItem
} from '../slices/queueSlice';

// Mock API 함수들
const mockQueueAPI = {
  getQueue: () => new Promise((resolve) => {
    setTimeout(() => resolve(mockQueue.waitingList), 500);
  }),
  addToQueue: (data) => new Promise((resolve) => {
    setTimeout(() => resolve({ ...data, id: Date.now() }), 500);
  }),
  removeFromQueue: (id) => new Promise((resolve) => {
    setTimeout(() => resolve(true), 500);
  }),
  updateQueueOrder: (order) => new Promise((resolve) => {
    setTimeout(() => resolve(order), 500);
  }),
  callNextPatient: () => new Promise((resolve) => {
    const nextPatient = mockQueue.waitingList[0];
    setTimeout(() => resolve(nextPatient), 500);
  })
};

// Mock data
const mockWaitingList = [
  {
    id: 1,
    waitingNumber: 'A001',
    name: '김환자',
    registeredTime: '09:30',
    type: '초진',
    status: '대기중'
  },
  {
    id: 2,
    waitingNumber: 'A002',
    name: '이환자',
    registeredTime: '09:45',
    type: '재진',
    status: '대기중'
  },
  // 더 많은 mock 데이터 추가 가능
];

export const fetchQueueData = createAsyncThunk(
  'queue/fetchData',
  async () => {
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockWaitingList;
  }
);

export const addPatientToQueue = (patientData) => async (dispatch) => {
  try {
    const data = await mockQueueAPI.addToQueue(patientData);
    dispatch(addToQueue(data));
    return data;
  } catch (error) {
    throw error;
  }
};

export const removePatientFromQueue = (id) => async (dispatch) => {
  try {
    await mockQueueAPI.removeFromQueue(id);
    dispatch(removeFromQueue(id));
  } catch (error) {
    throw error;
  }
};

export const callNextPatient = () => async (dispatch) => {
  try {
    const data = await mockQueueAPI.callNextPatient();
    if (data) {
      dispatch(setCurrentQueuePatient(data));
      dispatch(removeFromQueue(data.id));
    }
    return data;
  } catch (error) {
    throw error;
  }
};

export const reorderQueue = (newOrder) => async (dispatch) => {
  try {
    await mockQueueAPI.updateQueueOrder(newOrder);
    dispatch(updateQueueItem(newOrder));
  } catch (error) {
    throw error;
  }
}; 