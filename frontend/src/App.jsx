import React, { Suspense, lazy, useMemo, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, Layout, Spin } from 'antd';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/store';
import koKR from 'antd/lib/locale/ko_KR';
import Header from './components/Common/Header';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import { lightTheme, darkTheme } from './theme';
import { useState, useCallback } from 'react';

// 보안 컴포넌트들
import TokenRefreshManager from './components/Auth/TokenRefreshManager';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// 로딩 컴포넌트
const LoadingSpinner = React.memo(() => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '50vh',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <Spin size="large" />
    <p>페이지를 불러오는 중...</p>
  </div>
));

// 지연 로딩을 위한 컴포넌트들
const Home = lazy(() => import('./routes/Home'));
const PatientFormPage = lazy(() => import('./routes/PatientFormPage'));
const ReceptionDashboardPage = lazy(() => import('./routes/ReceptionDashboardPage'));
const QueueDisplayPage = lazy(() => import('./routes/QueueDisplayPage'));
const DoctorViewPage = lazy(() => import('./routes/DoctorViewPage'));
const PatientDataTable = lazy(() => import('./components/PatientDataTable'));

const { Content } = Layout;

const GlobalStyle = createGlobalStyle`
  body {
    background: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.text};
    font-family: 'Pretendard', 'Noto Sans KR', 'Roboto', Arial, sans-serif;
    overflow-x: hidden;
  }
  
  /* 화면 깜박임 방지 */
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    box-sizing: border-box;
  }
  
  /* GPU 가속 활성화 */
  .gpu-accelerated {
    transform: translateZ(0);
    will-change: transform;
    backface-visibility: hidden;
  }
  
  /* 스크롤 성능 최적화 */
  html {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
  
  /* 레이아웃 안정화 */
  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    transform: translateZ(0);
    backface-visibility: hidden;
  }
  
  /* 모달 깜빡임 방지 */
  .ant-modal {
    transform: translateZ(0);
    will-change: transform;
    backface-visibility: hidden;
  }
  
  .ant-modal-content {
    transform: translateZ(0);
    backface-visibility: hidden;
  }
  
  /* 스피너 깜빡임 방지 */
  .ant-spin {
    transform: translateZ(0);
  }
  
  /* 카드 깜빡임 방지 */
  .ant-card {
    transform: translateZ(0);
    backface-visibility: hidden;
  }
  
  /* 버튼 깜빡임 방지 */
  .ant-btn {
    transform: translateZ(0);
    backface-visibility: hidden;
  }
  
  /* 테이블 깜빡임 방지 */
  .ant-table {
    transform: translateZ(0);
  }
  
  .ant-table-content {
    transform: translateZ(0);
  }
`;

const App = () => {
  const [dark, setDark] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRef = useRef(false);
  
  // 앱 초기화 (한 번만 실행)
  useEffect(() => {
    if (!initializationRef.current) {
      console.log('앱 초기화 시작...');
      initializationRef.current = true;
      setIsInitialized(true);
      console.log('앱 초기화 완료');
    }
  }, []);
  
  // 테마 변경 최적화
  const handleToggleDark = useCallback(() => {
    setDark(prev => !prev);
  }, []);
  
  // 메모이제이션된 테마
  const currentTheme = useMemo(() => dark ? darkTheme : lightTheme, [dark]);
  
  // 메모이제이션된 로케일
  const locale = useMemo(() => koKR, []);

  // 초기화 전까지 로딩 표시
  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  console.log('App 컴포넌트 렌더링...');

  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyle />
      <Provider store={store}>
        <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
          <ConfigProvider locale={locale}>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <ErrorBoundary>
                <Layout className="gpu-accelerated">
                  <Header onToggleDark={handleToggleDark} dark={dark} />
                  <Content style={{ marginTop: 64 }}>
                    {/* 보안 관리자 컴포넌트 */}
                    <TokenRefreshManager />
                    
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/patient/new" element={
                          <ProtectedRoute requiredRoles={['admin', 'reception', 'doctor']}>
                            <PatientFormPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/patient/edit/:id" element={
                          <ProtectedRoute requiredRoles={['admin', 'reception', 'doctor']}>
                            <PatientFormPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/reception" element={
                          <ProtectedRoute requiredRoles={['admin', 'reception']}>
                            <ReceptionDashboardPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/queue" element={
                          <ProtectedRoute requiredRoles={['admin', 'reception', 'doctor']}>
                            <QueueDisplayPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/doctor" element={
                          <ProtectedRoute requiredRoles={['admin', 'doctor']}>
                            <DoctorViewPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/patient-data" element={
                          <ProtectedRoute requiredRoles={['admin', 'reception', 'doctor']}>
                            <PatientDataTable />
                          </ProtectedRoute>
                        } />
                      </Routes>
                    </Suspense>
                  </Content>
                </Layout>
              </ErrorBoundary>
            </BrowserRouter>
          </ConfigProvider>
        </PersistGate>
      </Provider>
    </ThemeProvider>
  );
};

export default React.memo(App);