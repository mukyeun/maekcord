import React from 'react';
import { Alert, Button, Card, Typography } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // 에러 로깅 (실제 환경에서는 Sentry 등 사용)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '50px 20px', 
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Card style={{ maxWidth: 600, width: '100%' }}>
            <Alert
              message="오류가 발생했습니다"
              description="애플리케이션에서 예상치 못한 오류가 발생했습니다."
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <Title level={3}>😔 죄송합니다</Title>
            <Text type="secondary">
              시스템에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
            </Text>
            
            <div style={{ marginTop: 32, display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />}
                onClick={this.handleReload}
                size="large"
              >
                새로고침
              </Button>
              
              <Button 
                icon={<HomeOutlined />}
                onClick={this.handleGoHome}
                size="large"
              >
                홈으로 이동
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: 24, textAlign: 'left' }}>
                <summary>개발자 정보 (개발 환경에서만 표시)</summary>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: 16, 
                  borderRadius: 4,
                  overflow: 'auto',
                  fontSize: 12
                }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 