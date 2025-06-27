import React, { useState, useEffect } from 'react';
import { Card, Progress, Statistic, Row, Col, Tooltip } from 'antd';
import { 
  HddOutlined, 
  ClockCircleOutlined, 
  ThunderboltOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import styled from 'styled-components';
import { useMemoryUsage, usePerformance } from '../../hooks/useMemoization';

const MonitorCard = styled(Card)`
  margin-bottom: 16px;
  
  .ant-card-body {
    padding: 16px;
  }
`;

const PerformanceMonitor = ({ showDetails = false }) => {
  const [fps, setFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [lastTime, setLastTime] = useState(performance.now());
  const memoryInfo = useMemoryUsage();
  const measurePerformance = usePerformance('Operation');

  // FPS 계산
  useEffect(() => {
    let animationId;
    
    const calculateFPS = (currentTime) => {
      setFrameCount(prev => prev + 1);
      
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        setFrameCount(0);
        setLastTime(currentTime);
      }
      
      animationId = requestAnimationFrame(calculateFPS);
    };
    
    animationId = requestAnimationFrame(calculateFPS);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [frameCount, lastTime]);

  // 메모리 사용률 계산
  const memoryUsagePercent = memoryInfo 
    ? Math.round((memoryInfo.used / memoryInfo.limit) * 100)
    : 0;

  // 성능 상태 평가
  const getPerformanceStatus = () => {
    if (fps >= 55) return { status: 'success', text: '우수' };
    if (fps >= 45) return { status: 'normal', text: '양호' };
    if (fps >= 30) return { status: 'warning', text: '보통' };
    return { status: 'exception', text: '나쁨' };
  };

  const performanceStatus = getPerformanceStatus();

  if (!showDetails) {
    return (
      <Tooltip title="성능 모니터링">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThunderboltOutlined style={{ color: performanceStatus.status === 'success' ? '#52c41a' : '#faad14' }} />
          <span style={{ fontSize: '12px' }}>{fps} FPS</span>
        </div>
      </Tooltip>
    );
  }

  return (
    <MonitorCard title="성능 모니터링" size="small">
      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title="FPS"
            value={fps}
            prefix={<ThunderboltOutlined />}
            suffix={
              <span style={{ 
                color: performanceStatus.status === 'success' ? '#52c41a' : 
                       performanceStatus.status === 'warning' ? '#faad14' : '#ff4d4f',
                fontSize: '12px',
                marginLeft: '4px'
              }}>
                ({performanceStatus.text})
              </span>
            }
          />
        </Col>
        
        {memoryInfo && (
          <Col span={8}>
            <Statistic
              title="메모리 사용률"
              value={memoryUsagePercent}
              prefix={<HddOutlined />}
              suffix="%"
            />
            <Progress 
              percent={memoryUsagePercent} 
              size="small" 
              status={memoryUsagePercent > 80 ? 'exception' : 'normal'}
              showInfo={false}
            />
          </Col>
        )}
        
        <Col span={8}>
          <Statistic
            title="메모리 사용량"
            value={memoryInfo ? Math.round(memoryInfo.used / 1024 / 1024) : 0}
            prefix={<HddOutlined />}
            suffix="MB"
          />
        </Col>
      </Row>
      
      {memoryInfo && (
        <div style={{ marginTop: 16, fontSize: '12px', color: '#666' }}>
          <div>총 메모리: {Math.round(memoryInfo.total / 1024 / 1024)} MB</div>
          <div>메모리 한계: {Math.round(memoryInfo.limit / 1024 / 1024)} MB</div>
        </div>
      )}
      
      <div style={{ marginTop: 8, fontSize: '11px', color: '#999' }}>
        <InfoCircleOutlined style={{ marginRight: 4 }} />
        성능 최적화가 적용되었습니다
      </div>
    </MonitorCard>
  );
};

export default PerformanceMonitor; 