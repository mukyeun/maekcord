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

const ReceptionDashboard = ({ visible, onClose }) => {
  const [patients, setPatients] = useState([
    // 테스트용 더미 데이터
    {
      id: 1,
      queueNumber: 'Q001',
      name: '김환자',
      visitType: '초진',
      status: 'waiting',
      registeredAt: new Date().toISOString(),
      birthDate: '1990-01-01',
      phone: '010-1234-5678',
      symptoms: '두통, 어지러움',
      stressLevel: '중간',
    },
    {
      id: 2,
      queueNumber: 'Q002',
      name: '이환자',
      visitType: '재진',
      status: 'called',
      registeredAt: new Date().toISOString(),
      birthDate: '1985-05-05',
      phone: '010-5678-1234',
      symptoms: '허리 통증',
      stressLevel: '높음',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

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
      setLoading(true);
      const response = await fetch('/api/queue');
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      message.error('대기자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async (patientId) => {
    try {
      // await fetch(`/api/queue/${patientId}/call`, { method: 'PUT' }); // 실제 API 연동 시 주석 해제
      message.success('환자를 호출했습니다.');
      // 임시로 상태 업데이트
      setPatients(patients.map(p => 
        p.id === patientId ? { ...p, status: 'called' } : p
      ));
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
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          waiting: { color: 'gold', text: '대기중' },
          called: { color: 'blue', text: '호출됨' },
          consulting: { color: 'green', text: '진료중' },
          completed: { color: 'gray', text: '완료' }
        };
        const { color, text } = statusMap[status] || statusMap.waiting;
        return <StatusBadge $status={status}>{text}</StatusBadge>;
      }
    },
    {
      title: '구분',
      dataIndex: 'visitType',
      key: 'visitType',
      render: (type) => (
        <VisitTypeBadge className={type === '초진' ? 'first' : 'repeat'}>
          {type}
        </VisitTypeBadge>
      )
    },
    {
      title: '접수번호',
      dataIndex: 'queueNumber',
      key: 'queueNumber'
    },
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '접수시간',
      dataIndex: 'registeredAt',
      key: 'registeredAt',
      render: (time) => new Date(time).toLocaleTimeString()
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
              onClick={() => handleCall(record.id)}
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
        <Space style={{ marginBottom: 16 }}>
          <RefreshButton 
            icon={<ReloadOutlined />} 
            onClick={fetchQueue}
            loading={loading}
          >
            새로고침
          </RefreshButton>
        </Space>

        <StyledTable 
          columns={columns}
          dataSource={patients}
          rowKey="id"
          loading={loading}
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