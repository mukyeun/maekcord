import React, { useState, useEffect } from 'react';
import { Modal, Typography, message, Button, Spin } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { queueApi } from '../../api/queueApi';
import {
  ControlBar,
  QueueList,
  QueueCard,
  QueueNumberText,
  PatientNameText,
  CallStatus,
  FullscreenButton
} from './styles';

const { Title } = Typography;

const QueueDisplay = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [queueItems, setQueueItems] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const loadQueueList = async () => {
    try {
      setLoading(true);
      const response = await queueApi.getQueue();
      if (response.success) {
        setQueueItems(response.data);
      }
    } catch (error) {
      message.error('대기목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCallPatient = async (queueItem) => {
    try {
      await queueApi.callPatient(queueItem._id);
      message.success(`${queueItem.patientInfo?.name || queueItem.queueNumber}님을 호출했습니다.`);
      loadQueueList();
    } catch (error) {
      message.error('환자 호출에 실패했습니다.');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadQueueList();
      const interval = setInterval(loadQueueList, 30000);
      return () => clearInterval(interval);
    }
  }, [visible]);

  return (
    <Modal
      title="대기 환자 목록"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      bodyStyle={{ padding: 0 }}
    >
      <div style={{ padding: 20 }}>
        <ControlBar>
          <Title level={4}>현재 대기 인원: {queueItems.length}명</Title>
          <Button
            type="primary"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? '전체화면 종료' : '전체화면'}
          </Button>
        </ControlBar>

        {loading ? (
          <Spin size="large" style={{ display: 'flex', justifyContent: 'center' }} />
        ) : (
          <QueueList>
            {queueItems.map(item => (
              <QueueCard key={item._id} $status={item.status}>
                <QueueNumberText>
                  {item.patientInfo?.name
                    ? `${item.patientInfo.name} (${item.queueNumber})`
                    : item.queueNumber}
                </QueueNumberText>

                <CallStatus $status={item.status}>
                  {item.status === 'waiting' ? '대기중' :
                  item.status === 'called' ? '호출됨' :
                  item.status === 'consulting' ? '진료중' : '완료'}
                </CallStatus>

                {item.status === 'waiting' && (
                  <Button
                    type="primary"
                    onClick={() => handleCallPatient(item)}
                    style={{ marginLeft: '16px' }}
                  >
                    호출
                  </Button>
                )}
              </QueueCard>
            ))}
          </QueueList>
        )}

        <FullscreenButton>
          <Button
            type="primary"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
            size="large"
          />
        </FullscreenButton>
      </div>
    </Modal>
  );
};

export default QueueDisplay;
