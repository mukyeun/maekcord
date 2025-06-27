import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Result, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';

const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  fallbackPath = '/',
  showAccessDenied = true 
}) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const location = useLocation();

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // 역할 검증이 필요한 경우
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user?.role);
    
    if (!hasRequiredRole) {
      if (showAccessDenied) {
        return (
          <Result
            status="403"
            icon={<LockOutlined />}
            title="접근 권한이 없습니다"
            subTitle="이 페이지에 접근할 권한이 없습니다. 관리자에게 문의하세요."
            extra={[
              <Button type="primary" key="home" onClick={() => window.location.href = '/'}>
                홈으로 돌아가기
              </Button>
            ]}
          />
        );
      } else {
        return <Navigate to={fallbackPath} replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute; 