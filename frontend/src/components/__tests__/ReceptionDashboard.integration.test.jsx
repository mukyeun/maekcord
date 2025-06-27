import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import ReceptionDashboard from '../ReceptionDashboard/ReceptionDashboard';
import authReducer from '../../store/slices/authSlice';
import queueReducer from '../../store/slices/queueSlice';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

// Mock API modules
jest.mock('../../api/queueApi', () => ({
  getQueueData: jest.fn(),
  addToQueue: jest.fn(),
  removeFromQueue: jest.fn(),
  updateQueueStatus: jest.fn()
}));

jest.mock('../../api/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }
}));

// Mock WebSocket
jest.mock('../../hooks/useRealtimeData', () => ({
  __esModule: true,
  default: () => ({
    isConnected: true,
    lastMessage: null,
    sendMessage: jest.fn()
  })
}));

// Mock API calls
const mockGetTodayQueues = jest.fn(() => Promise.resolve({
  success: true,
  data: [
    {
      _id: '1',
      queueNumber: 1,
      patientId: {
        basicInfo: {
          name: '홍길동',
          phone: '010-1234-5678'
        }
      },
      status: 'waiting',
      registeredAt: '2024-12-01T09:00:00Z'
    },
    {
      _id: '2',
      queueNumber: 2,
      patientId: {
        basicInfo: {
          name: '김철수',
          phone: '010-8765-4321'
        }
      },
      status: 'called',
      registeredAt: '2024-12-01T09:30:00Z'
    }
  ]
}));

jest.mock('../../services/api', () => ({
  getTodayQueues: mockGetTodayQueues,
  callPatient: jest.fn(() => Promise.resolve({ success: true })),
  updateQueueStatus: jest.fn(() => Promise.resolve({ success: true }))
}));

// Mock Ant Design components
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  },
  notification: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }
}));

// Mock responsive observer
const mockResponsiveObserver = {
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  getBreakpoint: () => ({ xs: true, sm: false, md: false, lg: false, xl: false, xxl: false })
};

// Mock the responsive observer before importing antd
jest.mock('antd/lib/grid/hooks/useBreakpoint', () => ({
  __esModule: true,
  default: () => mockResponsiveObserver
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      queue: queueReducer
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        user: { id: '1', name: 'Test User', role: 'reception' },
        token: 'test-token'
      },
      queue: {
        patients: [],
        loading: false,
        error: null
      }
    }
  });
};

const renderWithProvider = (component) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('ReceptionDashboard Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTodayQueues.mockResolvedValue({
      success: true,
      data: [
        {
          _id: '1',
          queueNumber: 1,
          patientId: {
            basicInfo: {
              name: '홍길동',
              phone: '010-1234-5678'
            }
          },
          status: 'waiting',
          registeredAt: '2024-12-01T09:00:00Z'
        },
        {
          _id: '2',
          queueNumber: 2,
          patientId: {
            basicInfo: {
              name: '김철수',
              phone: '010-8765-4321'
            }
          },
          status: 'called',
          registeredAt: '2024-12-01T09:30:00Z'
        }
      ]
    });
  });

  it('renders dashboard with authentication', () => {
    renderWithProvider(<ReceptionDashboard />);
    
    expect(screen.getByText(/접수실/i)).toBeInTheDocument();
  });

  it('displays queue management interface', () => {
    renderWithProvider(<ReceptionDashboard />);
    
    expect(screen.getByPlaceholderText('환자명, 연락처로 검색')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderWithProvider(<ReceptionDashboard />);
    
    expect(screen.getByText(/불러오는 중/i)).toBeInTheDocument();
  });

  it('shows offline mode alert', () => {
    renderWithProvider(<ReceptionDashboard />);
    
    expect(screen.getByText(/오프라인 모드/i)).toBeInTheDocument();
    expect(screen.getByText(/인터넷 연결이 끊어졌습니다/i)).toBeInTheDocument();
  });

  it('displays home button', () => {
    renderWithProvider(<ReceptionDashboard />);
    
    expect(screen.getByText(/홈으로/i)).toBeInTheDocument();
  });

  it('should handle keyboard shortcuts', async () => {
    renderWithProvider(<ReceptionDashboard />);
    
    // Test Ctrl+F for search focus
    fireEvent.keyDown(document, { key: 'f', ctrlKey: true });
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('환자명, 연락처로 검색');
      expect(document.activeElement).toBe(searchInput);
    });
  });
}); 