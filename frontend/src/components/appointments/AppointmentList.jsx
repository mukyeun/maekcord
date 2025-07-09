import React from 'react';
import { List, Card, Typography, Space } from 'antd';
import AppointmentStatus from './AppointmentStatus';
import moment from 'moment';

const { Text } = Typography;

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
            <Card style={{ width: '100%' }}>
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
            </Card>
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