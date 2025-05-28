import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from 'antd';
import styled from 'styled-components';
import Header from './components/Common/Header';
import AppRoutes from './routes';

const { Content } = Layout;

const StyledContent = styled(Content)`
  margin-top: 64px;
  min-height: calc(100vh - 64px);
  background: #fff;
`;

const App = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Header />
        <StyledContent>
          <AppRoutes />
        </StyledContent>
      </Layout>
    </BrowserRouter>
  );
};

export default App;