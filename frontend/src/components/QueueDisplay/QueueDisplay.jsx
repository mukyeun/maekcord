import React, { useState, useEffect } from 'react';
import { Modal, Typography, Button, message } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import {
  DisplayContainer,
  QueueList,
  QueueItem,
  QueueNumber,
  PatientName,
  CallStatus,
  ControlBar
} from './styles';

const { Title } = Typography;

const QueueDisplay = ({ visible, onClose }) => {
  const [queue, setQueue] = useState([
    // 테스트용 더미 데이터
    { queueNumber: 'Q001', name: '김', status: 'waiting' },
    { queueNumber: 'Q002', name: '이', status: 'called' },
    { queueNumber: 'Q003', name: '박', status: 'consulting' },
  ]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let interval;
    if (visible) {
      // fetchQueue(); // 실제 API 연동 시 주석 해제
      interval = setInterval(() => {
        // fetchQueue(); // 실제 API 연동 시 주석 해제
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible]);

  const fetchQueue = async () => {
    try {
      const response = await fetch('/api/queue');
      const data = await response.json();
      setQueue(data);
    } catch (error) {
      console.error('대기열 조회 실패:', error);
      message.error('대기열 정보를 불러오는데 실패했습니다.');
    }
  };

  const toggleFullscreen = () => {
    const element = document.documentElement;
    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error(`전체화면 전환 오류: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <Modal
      title="대기 순번 현황"
      open={visible}
      onCancel={onClose}
      width="80%"
      style={{ top: 20 }}
      footer={null}
    >
      <DisplayContainer>
        <ControlBar>
          <Title level={3}>현재 대기 환자</Title>
          <Button
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? '전체화면 종료' : '전체화면'}
          </Button>
        </ControlBar>

        <QueueList>
          {queue.map((patient) => (
            <QueueItem key={patient.queueNumber} $isCalled={patient.status === 'called'}>
              <QueueNumber>
                {patient.queueNumber}
              </QueueNumber>
              <PatientName>
                {patient.name}** 님
              </PatientName>
              <CallStatus $status={patient.status}>
                {patient.status === 'waiting' && '대기중'}
                {patient.status === 'called' && '입장하세요'}
                {patient.status === 'consulting' && '진료중'}
              </CallStatus>
            </QueueItem>
          ))}
        </QueueList>
      </DisplayContainer>
    </Modal>
  );
};

export default QueueDisplay; 