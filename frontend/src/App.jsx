import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, Layout, Spin } from 'antd';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/store';
import koKR from 'antd/lib/locale/ko_KR';
import Header from './components/Common/Header';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import { lightTheme, darkTheme } from './theme';
import { useState } from 'react';

// 보안 컴포넌트들
import TokenRefreshManager from './components/Auth/TokenRefreshManager';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// 로딩 컴포넌트
const LoadingSpinner = () => (
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
);

// 지연 로딩을 위한 컴포넌트들
const Home = lazy(() => import('./routes/Home'));
const PatientFormPage = lazy(() => import('./routes/PatientFormPage'));
const ReceptionDashboardPage = lazy(() => import('./routes/ReceptionDashboardPage'));
const QueueDisplayPage = lazy(() => import('./routes/QueueDisplayPage'));
const DoctorViewPage = lazy(() => import('./routes/DoctorViewPage'));

const { Content } = Layout;

const GlobalStyle = createGlobalStyle`
  body {
    background: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.text};
    font-family: 'Pretendard', 'Noto Sans KR', 'Roboto', Arial, sans-serif;
    transition: background 0.3s, color 0.3s;
  }
`;

const App = () => {
  const [dark, setDark] = useState(false);
  return (
    <ThemeProvider theme={dark ? darkTheme : lightTheme}>
      <GlobalStyle />
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ConfigProvider locale={koKR}>
            <BrowserRouter>
              <Layout>
                <Header onToggleDark={() => setDark(d => !d)} dark={dark} />
                <Content style={{ marginTop: 64 }}>
                  {/* 보안 관리자 컴포넌트 */}
                  <TokenRefreshManager />
                  
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/patient" element={
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
                    </Routes>
                  </Suspense>
                </Content>
              </Layout>
            </BrowserRouter>
          </ConfigProvider>
        </PersistGate>
      </Provider>
    </ThemeProvider>
  );
};

export default App;