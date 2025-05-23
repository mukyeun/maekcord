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
import styled from 'styled-components';

const DashboardContainer = styled.div`
  padding: 24px;
`;

const ReceptionDashboard = ({ visible, onClose }) => {
  const [queueList, setQueueList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const fetchQueueList = async () => {
    try {
      setLoading(true);
      const response = await queueApi.getQueue();
      setQueueList(response.data);
    } catch (error) {
      console.error('❌ 대기목록 조회 실패:', error);
      message.error('대기목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCallPatient = async (record) => {
    try {
      await queueApi.callPatient(record._id);
      message.success(`${record.patientInfo?.name || '환자'} 호출 완료`);
      fetchQueueList();
    } catch (error) {
      console.error('❌ 환자 호출 실패:', error);
      message.error('환자 호출에 실패했습니다.');
    }
  };

  const handleStatusChange = async (record, newStatus) => {
    try {
      await queueApi.updateStatus(record._id, newStatus);
      message.success('상태가 변경되었습니다.');
      fetchQueueList();
    } catch (error) {
      console.error('❌ 상태 변경 실패:', error);
      message.error('상태 변경에 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchQueueList();
    const interval = setInterval(fetchQueueList, 30000); // 30초마다 자동 새로고침
    return () => clearInterval(interval);
  }, []);

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
      width: 150,
    },
    {
      title: '환자명',
      key: 'name',
      width: 120,
      render: (record) => record.patientInfo?.name || '이름 없음',
    },
    {
      title: '방문유형',
      key: 'visitType',
      width: 100,
      render: (record) => record.patientInfo?.visitType || '-',
    },
    {
      title: '증상',
      key: 'symptoms',
      render: (record) => (
        <Space size={[0, 8]} wrap>
          {Array.isArray(record.symptoms) && record.symptoms.map((symptom) => (
            <Tag key={symptom} color="blue">{symptom}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '상태',
      key: 'status',
      width: 100,
      render: (record) => {
        const statusMap = {
          waiting: { text: '대기중', color: 'gold' },
          called: { text: '호출됨', color: 'green' },
          consulting: { text: '진료중', color: 'blue' },
          done: { text: '완료', color: 'gray' }
        };
        const status = statusMap[record.status] || { text: '알 수 없음', color: 'default' };
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: '작업',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'waiting' && (
            <Button type="primary" size="small" onClick={() => handleCallPatient(record)}>
              호출
            </Button>
          )}
          {record.status === 'called' && (
            <Button type="primary" size="small" onClick={() => handleStatusChange(record, 'consulting')}>
              진료시작
            </Button>
          )}
          {record.status === 'consulting' && (
            <Button type="primary" size="small" onClick={() => handleStatusChange(record, 'done')}>
              진료완료
            </Button>
          )}
        </Space>
      ),
    },
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
      <DashboardContainer>
        <Button 
          icon={<ReloadOutlined />}
          onClick={fetchQueueList}
          loading={loading}
          style={{ marginBottom: 16 }}
        >
          새로고침
        </Button>
        <StyledTable
          columns={columns}
          dataSource={queueList}
          loading={loading}
          rowKey="_id"
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
      </DashboardContainer>
    </Modal>
  );
};

export default ReceptionDashboard; 