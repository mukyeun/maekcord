import React from 'react';
import { Button, Space, Typography, Badge } from 'antd';
import { PlusOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/ko';
import styled from 'styled-components';

moment.locale('ko');

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

const CalendarCard = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(25, 118, 210, 0.08);
  padding: 24px;
  margin-bottom: 24px;
`;

const AppointmentCalendar = ({ appointments, selectedDate, onDateChange, onCreateClick }) => {
  const currentDate = moment(selectedDate);
  const firstDayOfMonth = moment(selectedDate).startOf('month');
  const lastDayOfMonth = moment(selectedDate).endOf('month');
  const startDay = firstDayOfMonth.day(); // 0 (일요일) ~ 6 (토요일)
  const daysInMonth = lastDayOfMonth.date();

  // 이전 달로 이동
  const handlePrevMonth = () => {
    const newDate = moment(selectedDate).subtract(1, 'month');
    onDateChange(newDate.toDate());
  };

  // 다음 달로 이동
  const handleNextMonth = () => {
    const newDate = moment(selectedDate).add(1, 'month');
    onDateChange(newDate.toDate());
  };

  // 날짜 선택
  const handleDateClick = (day) => {
    const newDate = moment(selectedDate).date(day);
    onDateChange(newDate.toDate());
  };

  // 달력 그리드 생성
  const renderCalendarGrid = () => {
    const days = [];
    const totalDays = Math.ceil((startDay + daysInMonth) / 7) * 7;

    // 이전 달의 날짜들
    for (let i = 0; i < startDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="calendar-day empty">
          <span></span>
        </div>
      );
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = moment(selectedDate).date(day);
      const isToday = date.isSame(moment(), 'day');
      const isSelected = date.isSame(selectedDate, 'day');
      const dayAppointments = appointments.filter(apt => 
        moment(apt.dateTime).isSame(date, 'day')
      );

      days.push(
        <div
          key={day}
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          <span>{day}</span>
          {dayAppointments.length > 0 && (
            <Badge 
              count={dayAppointments.length} 
              style={{ backgroundColor: '#1890ff' }}
            />
          )}
        </div>
      );
    }

    // 다음 달의 날짜들
    for (let i = days.length; i < totalDays; i++) {
      days.push(
        <div key={`empty-end-${i}`} className="calendar-day empty">
          <span></span>
        </div>
      );
    }

    return days;
  };

  return (
    <CalendarCard>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Button icon={<LeftOutlined />} onClick={handlePrevMonth} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            {currentDate.format('YYYY년 M월')}
          </Typography.Title>
          <Button icon={<RightOutlined />} onClick={handleNextMonth} />
        </Space>
        <MainButton onClick={onCreateClick}>
          새 예약
        </MainButton>
      </Space>

      <div className="calendar-container">
        <div className="calendar-header">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-body">
          {renderCalendarGrid()}
        </div>
      </div>

      <style jsx>{`
        .appointment-calendar {
          background: white;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #f0f0f0;
        }

        .calendar-container {
          border: 1px solid #f0f0f0;
          border-radius: 4px;
        }

        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #fafafa;
          border-bottom: 1px solid #f0f0f0;
        }

        .calendar-weekday {
          padding: 8px;
          text-align: center;
          font-weight: 500;
        }

        .calendar-body {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .calendar-day {
          aspect-ratio: 1;
          padding: 8px;
          border: 1px solid #f0f0f0;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          position: relative;
        }

        .calendar-day:hover {
          background-color: #f5f5f5;
        }

        .calendar-day.empty {
          background-color: #fafafa;
          cursor: default;
        }

        .calendar-day.selected {
          background-color: #e6f7ff;
        }

        .calendar-day.today {
          border: 2px solid #1890ff;
        }

        .calendar-day span {
          font-size: 14px;
        }
      `}</style>
    </CalendarCard>
  );
};

export default AppointmentCalendar; 