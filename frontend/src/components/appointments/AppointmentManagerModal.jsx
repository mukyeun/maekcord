import React, { useState, useEffect } from 'react';
import { Modal, Spin, Alert } from 'antd';
import { CalendarOutlined, HomeOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import AppointmentCalendar from './AppointmentCalendar';
import AppointmentList from './AppointmentList';
import AppointmentForm from './AppointmentForm';
import { fetchAppointments, fetchDoctors } from '../../api/appointmentApi';
import { toast } from 'react-toastify';
import moment from 'moment';

// 스타일 강화: 헤더, 카드, 버튼, 캘린더, 리스트 등
const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
  color: #fff;
  border-radius: 20px 20px 0 0;
  padding: 28px 32px 24px 32px;
  font-weight: 700;
  font-size: 28px;
  margin-bottom: 0;
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.08);
  border-bottom: 1.5px solid #e3e8ee;
`;

const HomeButton = styled.button`
  background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.12);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
    transform: translateY(-1px);
  }
`;

const AppointmentCard = styled.div`
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(25, 118, 210, 0.10);
  padding: 32px 28px 32px 28px;
  margin-bottom: 32px;
  min-height: 480px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;

const ResponsiveRow = styled.div`
  display: flex;
  gap: 32px;
  @media (max-width: 900px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const CalendarArea = styled.div`
  flex: 2;
  min-width: 340px;
`;

const ListArea = styled.div`
  flex: 1;
  min-width: 260px;
`;

const NoData = styled.div`
  color: #b0b8c1;
  font-size: 18px;
  text-align: center;
  margin-top: 48px;
  font-weight: 500;
`;

const ModalContent = styled.div`
  background: #f5f7fa;
  border-radius: 0 0 20px 20px;
  padding: 32px;
`;

const AppointmentManagerModal = ({ open, onClose }) => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment().toDate());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      loadAppointments();
      loadDoctors();
    }
  }, [open, selectedDate]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAppointments(selectedDate);
      setAppointments(data || []);
    } catch (error) {
      setError('예약 목록을 불러오는데 실패했습니다.');
      toast.error('예약 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await fetchDoctors();
      setDoctors(data || []);
    } catch (error) {
      toast.error('의사 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleDateChange = (date) => {
    const newDate = moment(date).startOf('day');
    setSelectedDate(newDate.toDate());
  };

  const handleFormOpen = () => {
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const handleAppointmentCreated = () => {
    loadAppointments();
    handleFormClose();
    toast.success('예약이 생성되었습니다.');
  };

  const handleHomeClick = () => {
    window.location.href = '/';
  };

  const renderHeader = () => (
    <PageHeader>
      <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <CalendarOutlined style={{ fontSize: 36, marginRight: 8 }} />
        예약 관리
      </span>
      <HomeButton onClick={handleHomeClick}>
        <HomeOutlined style={{ fontSize: 20 }} />
        홈으로 돌아가기
      </HomeButton>
    </PageHeader>
  );

  const renderContent = () => {
    if (error) {
      return (
        <ModalContent>
          <Alert 
            message="오류 발생" 
            description={error} 
            type="error" 
            showIcon 
            style={{ borderRadius: 12, marginBottom: 24 }} 
          />
        </ModalContent>
      );
    }

    return (
      <ModalContent>
        <Spin spinning={loading}>
          <ResponsiveRow>
            <CalendarArea>
              <AppointmentCard>
                <AppointmentCalendar
                  appointments={appointments}
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  onCreateClick={handleFormOpen}
                />
              </AppointmentCard>
            </CalendarArea>
            <ListArea>
              <AppointmentCard>
                <AppointmentList
                  appointments={appointments}
                  selectedDate={selectedDate}
                  onAppointmentUpdate={loadAppointments}
                />
                {(!appointments || appointments.length === 0) && (
                  <NoData>예약이 없습니다.</NoData>
                )}
              </AppointmentCard>
            </ListArea>
          </ResponsiveRow>
        </Spin>
      </ModalContent>
    );
  };

  return (
    <Modal 
      open={open} 
      onCancel={onClose} 
      footer={null} 
      width={1100} 
      styles={{ body: { padding: 0 } }}
      style={{ borderRadius: 20, overflow: 'hidden' }}
    >
      {renderHeader()}
      {renderContent()}
      <AppointmentForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleAppointmentCreated}
        doctors={doctors}
        selectedDate={selectedDate}
      />
    </Modal>
  );
};

export default AppointmentManagerModal; 