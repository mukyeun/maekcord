import React from 'react';
import { Button, Spin, Alert } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import QueueDisplay from '../components/QueueDisplay/QueueDisplay';

const QueueDisplayPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(state => state.auth);

  // 인증 체크
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleClose = () => navigate('/');

  return (
    <div style={{
      maxWidth: 700, margin: '40px auto', padding: 40,
      background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(24,144,255,0.08)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>대기목록</h2>
        <Button 
          type="text" 
          onClick={handleClose} 
          icon={<CloseOutlined />}
          aria-label="닫기"
        />
      </div>
      <QueueDisplay visible={true} onClose={handleClose} />
    </div>
  );
};

export default QueueDisplayPage;
