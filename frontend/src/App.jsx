import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, Layout } from 'antd';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/store';
import koKR from 'antd/lib/locale/ko_KR';
import Header from './components/Common/Header';
import AppRoutes from './routes';
import './App.css';

const { Content } = Layout;

const App = () => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <ConfigProvider locale={koKR}>
        <BrowserRouter>
          <Layout>
            <Header />
            <Content style={{ marginTop: 64 }}>
              <AppRoutes />
            </Content>
          </Layout>
        </BrowserRouter>
      </ConfigProvider>
    </PersistGate>
  </Provider>
);

export default App;