import React, { useState, useEffect } from 'react';
import { Layout, Typography, Spin, Alert } from 'antd';
import AppointmentCalendar from '../components/appointments/AppointmentCalendar';
import AppointmentList from '../components/appointments/AppointmentList';
import AppointmentForm from '../components/appointments/AppointmentForm';
import { useSelector } from 'react-redux';
import { fetchAppointments, fetchDoctors } from '../api/appointmentApi';
import { toast } from 'react-toastify';
import moment from 'moment';

const { Content } = Layout;

const AppointmentPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment().toDate());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    loadAppointments();
    loadDoctors();
  }, [selectedDate]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAppointments(selectedDate);
      console.log('Appointments loaded:', data);
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('예약 목록을 불러오는데 실패했습니다.');
      toast.error('예약 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await fetchDoctors();
      console.log('Doctors loaded:', data);
      setDoctors(data || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast.error('의사 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleDateChange = (date) => {
    // 날짜 선택 시 해당 날짜의 시작 시간(00:00:00)으로 설정
    const newDate = moment(date).startOf('day');
    console.log('Date changed:', newDate.format('YYYY-MM-DD HH:mm:ss'));
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

  if (error) {
    return (
      <Content style={{ margin: '24px' }}>
        <Alert
          message="오류 발생"
          description={error}
          type="error"
          showIcon
        />
      </Content>
    );
  }

  return (
    <Content style={{ margin: '24px' }}>
      <Typography.Title level={2}>예약 관리</Typography.Title>
      
      <Spin spinning={loading}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ flex: '2' }}>
            <AppointmentCalendar
              appointments={appointments}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              onCreateClick={handleFormOpen}
            />
          </div>
          
          <div style={{ flex: '1' }}>
            <AppointmentList
              appointments={appointments}
              selectedDate={selectedDate}
              onAppointmentUpdate={loadAppointments}
            />
          </div>
        </div>
      </Spin>

      <AppointmentForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleAppointmentCreated}
        doctors={doctors}
        selectedDate={selectedDate}
      />
    </Content>
  );
};

export default AppointmentPage; 