import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, message, TimePicker, Button } from 'antd';
import { createAppointment, getAvailableSlots, checkAppointmentOverlap } from '../../api/appointmentApi';
import { searchPatients } from '../../api/patientApi';
import moment from 'moment';
import debounce from 'lodash/debounce';
import 'moment/locale/ko';
import { CalendarOutlined } from '@ant-design/icons';
import styled from 'styled-components';

moment.locale('ko');

const { Option } = Select;
const { TextArea } = Input;

// 홈/진료실/예약페이지와 통일된 메인 버튼
const MainButton = styled(Button)`
  background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.12);
  padding: 0 32px;
  height: 44px;
  font-size: 16px;
  &:hover, &:focus {
    background: linear-gradient(135deg, #1565C0 0%, #1976D2 100%);
    color: #fff;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
  color: #fff;
  border-radius: 20px 20px 0 0;
  padding: 28px 32px 24px 32px;
  font-weight: 700;
  font-size: 28px;
  margin: -24px -24px 24px -24px;
`;

const FormCard = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(25, 118, 210, 0.08);
  padding: 24px;
  margin-bottom: 24px;
`;

const AppointmentForm = ({ open, onClose, onSuccess, doctors, selectedDate }) => {
  const [form] = Form.useForm();
  const [patients, setPatients] = useState([]);
  const [searching, setSearching] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        dateTime: moment(selectedDate),
        duration: 30,
        type: 'initial'
      });
    }
  }, [open, selectedDate, form]);

  useEffect(() => {
    if (selectedDoctor && form.getFieldValue('dateTime')) {
      loadAvailableSlots();
    }
  }, [selectedDoctor, form.getFieldValue('dateTime')]);

  const loadAvailableSlots = async () => {
    try {
      const date = form.getFieldValue('dateTime');
      if (!date || !selectedDoctor) return;

      const slots = await getAvailableSlots(
        date.format('YYYY-MM-DD'),
        selectedDoctor
      );
      setAvailableSlots(slots);
    } catch (error) {
      message.error('예약 가능한 시간을 불러오는데 실패했습니다.');
    }
  };

  const handleSearch = debounce(async (value) => {
    if (!value) {
      setPatients([]);
      return;
    }

    try {
      setSearching(true);
      const results = await searchPatients(value);
      setPatients(results);
    } catch (error) {
      message.error('환자 검색 중 오류가 발생했습니다.');
    } finally {
      setSearching(false);
    }
  }, 300);

  const handleDoctorChange = (value) => {
    setSelectedDoctor(value);
  };

  const handleDateChange = (date) => {
    form.setFieldsValue({ dateTime: date });
    if (selectedDoctor) {
      loadAvailableSlots();
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // 예약 시간 중복 체크
      const overlapCheck = await checkAppointmentOverlap(
        values.doctorId,
        values.dateTime.toDate(),
        values.duration
      );

      if (overlapCheck.isOverlap) {
        message.error(overlapCheck.message);
        return;
      }

      const formattedValues = {
        ...values,
        dateTime: values.dateTime.toDate()
      };
      
      await createAppointment(formattedValues);
      message.success('예약이 생성되었습니다.');
      onSuccess();
      form.resetFields();
    } catch (error) {
      message.error('예약 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<ModalHeader><CalendarOutlined style={{ fontSize: 32, marginRight: 8 }} />예약 생성/수정</ModalHeader>}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="생성"
      cancelText="취소"
      confirmLoading={loading}
      styles={{ body: { background: '#f5f7fa', borderRadius: '0 0 20px 20px', padding: 32 } }}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <FormCard>
          <Form.Item
            name="patientId"
            label="환자"
            rules={[{ required: true, message: '환자를 선택해주세요' }]}
          >
            <Select
              showSearch
              placeholder="환자 이름, 차트번호, 연락처로 검색"
              defaultActiveFirstOption={false}
              showArrow={false}
              filterOption={false}
              onSearch={handleSearch}
              loading={searching}
              notFoundContent={searching ? '검색중...' : '환자를 찾을 수 없습니다'}
            >
              {patients.map(patient => (
                <Option key={patient._id} value={patient._id}>
                  {`${patient.name} (${patient.chartNumber}) - ${patient.phoneNumber}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="doctorId"
            label="담당 의사"
            rules={[{ required: true, message: '담당 의사를 선택해주세요' }]}
          >
            <Select 
              placeholder="담당 의사 선택"
              onChange={handleDoctorChange}
            >
              {doctors.map(doctor => (
                <Option key={doctor._id} value={doctor._id}>{doctor.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dateTime"
            label="예약 일시"
            rules={[{ required: true, message: '예약 일시를 선택해주세요' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              onChange={handleDateChange}
              disabledDate={(current) => {
                return current && current < moment().startOf('day');
              }}
            />
          </Form.Item>

          {selectedDoctor && form.getFieldValue('dateTime') && (
            <Form.Item
              name="timeSlot"
              label="예약 시간"
              rules={[{ required: true, message: '예약 시간을 선택해주세요' }]}
            >
              <Select placeholder="예약 시간 선택">
                {availableSlots.map(slot => (
                  <Option 
                    key={slot.datetime} 
                    value={slot.datetime}
                  >
                    {`${slot.startTime} - ${slot.endTime}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="type"
            label="예약 유형"
            rules={[{ required: true, message: '예약 유형을 선택해주세요' }]}
          >
            <Select>
              <Option value="initial">초진</Option>
              <Option value="follow-up">재진</Option>
              <Option value="emergency">응급</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="duration"
            label="예약 시간 (분)"
            rules={[
              { required: true, message: '예약 시간을 입력해주세요' },
              { type: 'number', min: 15, message: '최소 예약 시간은 15분입니다' },
              { type: 'number', max: 120, message: '최대 예약 시간은 120분입니다' }
            ]}
          >
            <InputNumber min={15} max={120} step={15} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="description"
            label="설명"
            rules={[{ max: 500, message: '설명은 500자를 초과할 수 없습니다' }]}
          >
            <TextArea rows={4} maxLength={500} showCount />
          </Form.Item>
        </FormCard>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <MainButton onClick={onClose} style={{ background: '#e0e0e0', color: '#333' }}>
            취소
          </MainButton>
          <MainButton onClick={() => form.submit()} loading={loading}>
            생성
          </MainButton>
        </div>
      </Form>
    </Modal>
  );
};

export default AppointmentForm; 