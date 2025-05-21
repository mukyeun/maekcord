import React, { useState, useEffect } from 'react';
import { Modal, Table, Tag, Button, Space, Drawer, Descriptions, message } from 'antd';
import { UserOutlined, ReloadOutlined, BellOutlined } from '@ant-design/icons';
import {
  DashboardWrapper,
  StyledTable,
  StatusBadge,
  DetailCard,
  ActionButton,
  RefreshButton,
  PatientInfo,
  DrawerContent,
  VisitTypeBadge
} from './styles';
import { queueApi } from '../../api/queueApi';

const ReceptionDashboard = ({ visible, onClose }) => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await queueApi.getQueue();
      setQueue(response.data);
    } catch (error) {
      message.error('대기 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // 30초마다 자동 새로고침
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCall = async (patientId) => {
    try {
      await queueApi.callPatient(patientId);
      message.success('환자를 호출했습니다.');
      fetchQueue(); // 목록 새로고침
    } catch (error) {
      message.error('환자 호출에 실패했습니다.');
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      waiting: { color: '#fa8c16', className: 'waiting' },
      called: { color: '#1890ff', className: 'called' },
      consulting: { color: '#52c41a', className: 'consulting' },
      completed: { color: '#8c8c8c', className: 'completed' }
    };
    return styles[status] || styles.waiting;
  };

  const columns = [
    {
      title: '대기번호',
      dataIndex: 'queueNumber',
      key: 'queueNumber',
    },
    {
      title: '환자명',
      dataIndex: ['patientId', 'basicInfo', 'name'],
      key: 'name',
    },
    {
      title: '증상',
      dataIndex: 'symptoms',
      key: 'symptoms',
      render: (symptoms) => (
        <>
          {symptoms.map((symptom) => (
            <Tag key={symptom}>{symptom}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          waiting: { text: '대기중', color: 'blue' },
          in_progress: { text: '진료중', color: 'green' },
          done: { text: '완료', color: 'gray' }
        };
        const { text, color } = statusMap[status] || {};
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '액션',
      key: 'action',
      render: (_, record) => (
        <Space>
          <ActionButton 
            onClick={() => {
              setSelectedPatient(record);
              setDetailVisible(true);
            }}
          >
            상세정보
          </ActionButton>
          {record.status === 'waiting' && (
            <ActionButton 
              className="call-button"
              icon={<BellOutlined />}
              onClick={() => handleCall(record.patientId)}
            >
              호출
            </ActionButton>
          )}
        </Space>
      )
    }
  ];

  return (
    <Modal
      title="접수실 대시보드"
      open={visible}
      onCancel={onClose}
      width="80%"
      style={{ top: 20 }}
      footer={null}
    >
      <DashboardWrapper>
        <Button 
          icon={<ReloadOutlined />}
          onClick={fetchQueue}
          loading={loading}
          style={{ marginBottom: 16 }}
        >
          새로고침
        </Button>
        <StyledTable
          columns={columns}
          dataSource={queue}
          loading={loading}
          rowKey="queueNumber"
          pagination={false}
        />

        <Drawer
          title="환자 상세 정보"
          placement="right"
          onClose={() => setDetailVisible(false)}
          open={detailVisible}
          width={600}
        >
          {selectedPatient && (
            <DrawerContent>
              <DetailCard title="기본 정보">
                <PatientInfo>
                  <div className="info-item">
                    <div className="label">이름</div>
                    <div className="value">{selectedPatient.name}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">생년월일</div>
                    <div className="value">{selectedPatient.birthDate}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">연락처</div>
                    <div className="value">{selectedPatient.phone}</div>
                  </div>
                </PatientInfo>
              </DetailCard>

              <DetailCard title="진료 정보">
                <Descriptions column={1}>
                  <Descriptions.Item label="주요 증상">{selectedPatient.symptoms}</Descriptions.Item>
                  <Descriptions.Item label="스트레스 지수">{selectedPatient.stressLevel}</Descriptions.Item>
                </Descriptions>
              </DetailCard>
            </DrawerContent>
          )}
        </Drawer>
      </DashboardWrapper>
    </Modal>
  );
};

export default ReceptionDashboard; 