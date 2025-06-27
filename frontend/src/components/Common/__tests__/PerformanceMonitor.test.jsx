import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PerformanceMonitor from '../PerformanceMonitor';
import authReducer from '../../../store/slices/authSlice';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

// Mock Ant Design components to avoid responsive issues
jest.mock('antd', () => ({
  Card: ({ children, ...props }) => <div data-testid="ant-card" {...props}>{children}</div>,
  Row: ({ children, ...props }) => <div data-testid="ant-row" {...props}>{children}</div>,
  Col: ({ children, ...props }) => <div data-testid="ant-col" {...props}>{children}</div>,
  Progress: ({ percent, ...props }) => <div data-testid="ant-progress" data-percent={percent} {...props} />,
  Statistic: ({ title, value, ...props }) => (
    <div data-testid="ant-statistic" {...props}>
      <div data-testid="statistic-title">{title}</div>
      <div data-testid="statistic-value">{value}</div>
    </div>
  ),
  Typography: {
    Title: ({ children, ...props }) => <h3 data-testid="ant-title" {...props}>{children}</h3>,
    Text: ({ children, ...props }) => <span data-testid="ant-text" {...props}>{children}</span>,
  },
  Space: ({ children, ...props }) => <div data-testid="ant-space" {...props}>{children}</div>,
  Tag: ({ children, ...props }) => <span data-testid="ant-tag" {...props}>{children}</span>,
  Tooltip: ({ children, ...props }) => <div data-testid="ant-tooltip" {...props}>{children}</div>,
}));

// Mock Ant Design icons
jest.mock('@ant-design/icons', () => ({
  InfoCircleOutlined: ({ ...props }) => <span data-testid="info-icon" {...props}>ℹ️</span>,
  HddOutlined: ({ ...props }) => <span data-testid="hdd-icon" {...props}>💾</span>,
  DashboardOutlined: ({ ...props }) => <span data-testid="dashboard-icon" {...props}>📊</span>,
  ThunderboltOutlined: ({ ...props }) => <span data-testid="thunderbolt-icon" {...props}>⚡</span>,
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer
    }
  });
};

const renderWithProvider = (component) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders compact view correctly', () => {
    renderWithProvider(<PerformanceMonitor showDetails={false} />);
    
    expect(screen.getByText(/FPS/)).toBeInTheDocument();
  });

  it('renders detailed view correctly', () => {
    renderWithProvider(<PerformanceMonitor showDetails={true} />);
    
    expect(screen.getByTestId('ant-card')).toHaveAttribute('title', '성능 모니터링');
    expect(screen.getByText('FPS')).toBeInTheDocument();
    expect(screen.getByText('메모리 사용률')).toBeInTheDocument();
    expect(screen.getByText('메모리 사용량')).toBeInTheDocument();
  });

  it('calculates memory usage percentage correctly', async () => {
    renderWithProvider(<PerformanceMonitor showDetails={true} />);
    
    await waitFor(() => {
      // 1000000 / 5000000 * 100 = 20%
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByTestId('ant-progress')).toHaveAttribute('data-percent', '20');
    });
  });

  it('shows performance optimization message', () => {
    renderWithProvider(<PerformanceMonitor showDetails={true} />);
    
    expect(screen.getByText(/성능 최적화가 적용되었습니다/)).toBeInTheDocument();
  });

  it('displays memory information in MB', async () => {
    renderWithProvider(<PerformanceMonitor showDetails={true} />);
    
    await waitFor(() => {
      // 1000000 bytes = 1 MB
      expect(screen.getByText('1')).toBeInTheDocument();
      // 텍스트가 여러 요소로 나뉘어져 있으므로 더 유연한 검색
      const totalMemoryElements = screen.getAllByText((content, element) => {
        return element.textContent.includes('총 메모리: 2 MB');
      });
      expect(totalMemoryElements.length).toBeGreaterThan(0);
      
      const memoryLimitElements = screen.getAllByText((content, element) => {
        return element.textContent.includes('메모리 한계: 5 MB');
      });
      expect(memoryLimitElements.length).toBeGreaterThan(0);
    });
  });
}); 