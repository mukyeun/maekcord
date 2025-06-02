import React, { useState, useEffect } from 'react';
import { Modal, Space, Button, Typography, message, Card, Row, Col, Empty } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import WaitingList from './WaitingList';
import { getQueueList, updateQueueStatus } from '../../api/queueApi';
import styled from 'styled-components';

const { Title } = Typography;

const Container = styled.div`
  padding: 20px;
`;

const ReceptionDashboard = ({ visible, onClose }) => {
  const [queueList, setQueueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPatient, setCurrentPatient] = useState(null);

  const fetchQueueList = async () => {
    try {
      console.log('Fetching queue list...');
      const response = await getQueueList();
      console.log('Queue list received:', response);
      
      // data 배열만 추출하여 저장
      if (response.success && Array.isArray(response.data)) {
        setQueueList(response.data);
      } else {
        setQueueList([]);
        console.error('Invalid queue list format:', response);
      }
    } catch (error) {
      console.error('Failed to fetch queue list:', error);
      message.error('대기 목록을 불러오는데 실패했습니다.');
      setQueueList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchQueueList();
      const interval = setInterval(fetchQueueList, 10000);
      return () => clearInterval(interval);
    }
  }, [visible]);

  const handleQueueUpdate = async (queueId, newStatus) => {
    try {
      console.log('Updating queue status:', queueId, newStatus); // 상태 업데이트 시도
      await updateQueueStatus(queueId, newStatus);
      message.success('상태가 업데이트되었습니다.');
      fetchQueueList(); // 목록 새로고침
    } catch (error) {
      console.error('Failed to update queue status:', error);
      message.error('상태 업데이트에 실패했습니다.');
    }
  };

  // 현재 진료 상태 표시
  const renderCurrentStatus = () => {
    return (
      <Card title="현재 진료 상태">
        {currentPatient ? (
          <>
            <div>대기번호: #{currentPatient.waitingNumber}</div>
            <div>상태: {currentPatient.status === 'called' ? '호출됨' : '진료중'}</div>
          </>
        ) : (
          <Empty description="현재 진료중인 환자가 없습니다" />
        )}
      </Card>
    );
  };

  // 대기 환자 목록 표시
  const renderWaitingList = () => {
    const waitingPatients = queueList.filter(patient => patient.status === 'WAITING');

    return (
      <Card title="대기 환자 목록">
        {waitingPatients.length > 0 ? (
          waitingPatients.map((patient, index) => (
            <Card.Grid key={patient._id} style={{ width: '100%', padding: '12px' }}>
              <Row>
                <Col span={8}>
                  #{patient.waitingNumber}
                </Col>
                <Col span={8}>
                  {patient.patientName}
                </Col>
                <Col span={8}>
                  {new Date(patient.registeredAt).toLocaleTimeString()}
                </Col>
              </Row>
            </Card.Grid>
          ))
        ) : (
          <Empty description="현재 대기중인 환자가 없습니다" />
        )}
      </Card>
    );
  };

  return (
    <Modal
      title="접수실 대기 목록"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <WaitingList 
        queueList={queueList} 
        loading={loading}
        onQueueUpdate={handleQueueUpdate} 
      />
    </Modal>
  );
};

export default ReceptionDashboard; 