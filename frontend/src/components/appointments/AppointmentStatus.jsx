import React from 'react';
import { Tag, Button, Popconfirm, Space, message } from 'antd';
import { updateAppointmentStatus } from '../../api/appointmentApi';
import moment from 'moment';

const STATUS_COLORS = {
  scheduled: 'blue',
  completed: 'green',
  cancelled: 'red',
  no_show: 'orange'
};

const STATUS_LABELS = {
  scheduled: '예약됨',
  completed: '완료',
  cancelled: '취소됨',
  no_show: '노쇼'
};

const AppointmentStatus = ({ appointment, onStatusChange }) => {
  const handleStatusChange = async (newStatus) => {
    try {
      await updateAppointmentStatus(appointment._id, newStatus);
      message.success('예약 상태가 변경되었습니다.');
      onStatusChange && onStatusChange(newStatus);
    } catch (error) {
      message.error('상태 변경에 실패했습니다.');
    }
  };

  const isUpcoming = moment(appointment.dateTime).isAfter(moment());
  const isPast = moment(appointment.dateTime).isBefore(moment());

  const renderStatusActions = () => {
    const { status } = appointment;

    switch (status) {
      case 'scheduled':
        return (
          <Space>
            {isPast && (
              <>
                <Popconfirm
                  title="예약을 완료 처리하시겠습니까?"
                  onConfirm={() => handleStatusChange('completed')}
                  okText="예"
                  cancelText="아니오"
                >
                  <Button size="small" type="primary">
                    완료
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title="노쇼로 처리하시겠습니까?"
                  onConfirm={() => handleStatusChange('no_show')}
                  okText="예"
                  cancelText="아니오"
                >
                  <Button size="small" danger>
                    노쇼
                  </Button>
                </Popconfirm>
              </>
            )}
            {isUpcoming && (
              <Popconfirm
                title="예약을 취소하시겠습니까?"
                onConfirm={() => handleStatusChange('cancelled')}
                okText="예"
                cancelText="아니오"
              >
                <Button size="small" danger>
                  취소
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      
      case 'completed':
      case 'cancelled':
      case 'no_show':
        return null;
      
      default:
        return null;
    }
  };

  return (
    <Space>
      <Tag color={STATUS_COLORS[appointment.status]}>
        {STATUS_LABELS[appointment.status]}
      </Tag>
      {renderStatusActions()}
    </Space>
  );
};

export default AppointmentStatus; 