import React from 'react';
import { List, Card, Typography, Space } from 'antd';
import AppointmentStatus from './AppointmentStatus';
import moment from 'moment';
import styled from 'styled-components';

const { Text } = Typography;

// 홈/진료실/예약페이지와 통일된 메인 버튼
const MainButton = styled.button`
  background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.12);
  padding: 0 32px;
  height: 44px;
  font-size: 16px;
  cursor: pointer;
  &:hover, &:focus {
    background: linear-gradient(135deg, #1565C0 0%, #1976D2 100%);
    color: #fff;
  }
`;

const ListCard = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(25, 118, 210, 0.08);
  padding: 24px;
  margin-bottom: 24px;
`;

const AppointmentList = ({ appointments, selectedDate, onAppointmentUpdate }) => {
  const handleStatusChange = (appointmentId) => {
    onAppointmentUpdate();
  };

  return (
    <div>
      <Typography.Title level={4}>
        {moment(selectedDate).format('YYYY년 M월 D일')} 예약 목록
      </Typography.Title>
      
      <List
        dataSource={appointments}
        renderItem={appointment => (
          <List.Item>
            <ListCard>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text strong>
                    {moment(appointment.dateTime).format('HH:mm')}
                  </Text>
                  <AppointmentStatus
                    appointment={appointment}
                    onStatusChange={() => handleStatusChange(appointment._id)}
                  />
                </Space>
                
                <Space direction="vertical">
                  <Text>
                    환자: {appointment.patientId?.name}
                    {appointment.patientId?.chartNumber && 
                      ` (${appointment.patientId.chartNumber})`}
                  </Text>
                  <Text>담당의: {appointment.doctorId?.name}</Text>
                  <Text>
                    진료 유형: {
                      appointment.type === 'initial' ? '초진' :
                      appointment.type === 'follow-up' ? '재진' :
                      appointment.type === 'emergency' ? '응급' : 
                      appointment.type
                    }
                  </Text>
                  <Text>예약 시간: {appointment.duration}분</Text>
                  {appointment.notes && (
                    <Text type="secondary">메모: {appointment.notes}</Text>
                  )}
                </Space>
              </Space>
            </ListCard>
          </List.Item>
        )}
        locale={{
          emptyText: '예약이 없습니다.'
        }}
      />
    </div>
  );
};

export default AppointmentList; 