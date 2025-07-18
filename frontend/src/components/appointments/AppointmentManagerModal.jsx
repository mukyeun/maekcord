import React, { useState, useEffect } from 'react';
import { Tabs, Table, Button, Form, Input, DatePicker, Select, message, Space, Tag, Alert, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosInstance from '../../api/axiosInstance';
import UnifiedModal from '../Common/UnifiedModal';

const { TabPane } = Tabs;
const { Option } = Select;

const AppointmentManagerModal = ({ open, onClose }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [editingAppointment, setEditingAppointment] = useState(null);

  // 예약 목록 조회
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/appointments');
      setAppointments(response.data.data || []);
    } catch (error) {
      console.error('예약 목록 조회 실패:', error);
      message.error('예약 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 예약 등록/수정
  const handleSubmit = async (values) => {
    try {
      const appointmentData = {
        ...values,
        appointmentDate: values.appointmentDate.format('YYYY-MM-DD'),
        appointmentTime: values.appointmentTime.format('HH:mm')
      };

      if (editingAppointment) {
        // 수정
        await axiosInstance.put(`/appointments/${editingAppointment._id}`, appointmentData);
        message.success('예약이 수정되었습니다.');
      } else {
        // 등록
        await axiosInstance.post('/appointments', appointmentData);
        message.success('예약이 등록되었습니다.');
      }

      form.resetFields();
      setEditingAppointment(null);
      fetchAppointments();
    } catch (error) {
      console.error('예약 처리 실패:', error);
      message.error('예약 처리 중 오류가 발생했습니다.');
    }
  };

  // 예약 삭제
  const handleDelete = async (appointmentId) => {
    try {
      await axiosInstance.delete(`/appointments/${appointmentId}`);
      message.success('예약이 삭제되었습니다.');
      fetchAppointments();
    } catch (error) {
      console.error('예약 삭제 실패:', error);
      message.error('예약 삭제 중 오류가 발생했습니다.');
    }
  };

  // 예약 수정 모드
  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    form.setFieldsValue({
      patientName: appointment.patientName,
      phone: appointment.phone,
      appointmentDate: dayjs(appointment.appointmentDate),
      appointmentTime: dayjs(appointment.appointmentTime, 'HH:mm'),
      visitType: appointment.visitType,
      memo: appointment.memo
    });
  };

  useEffect(() => {
    if (open) {
      fetchAppointments();
    }
  }, [open]);

  const columns = [
    {
      title: '환자명',
      dataIndex: 'patientName',
      key: 'patientName',
    },
    {
      title: '연락처',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '예약일',
      dataIndex: 'appointmentDate',
      key: 'appointmentDate',
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '예약시간',
      dataIndex: 'appointmentTime',
      key: 'appointmentTime',
    },
    {
      title: '진료유형',
      dataIndex: 'visitType',
      key: 'visitType',
      render: (type) => (
        <Tag color={type === '초진' ? 'blue' : 'green'}>
          {type}
        </Tag>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'confirmed' ? 'green' : 
          status === 'pending' ? 'orange' : 
          status === 'cancelled' ? 'red' : 'default'
        }>
          {status === 'confirmed' ? '확정' : 
           status === 'pending' ? '대기' : 
           status === 'cancelled' ? '취소' : status}
        </Tag>
      ),
    },
    {
      title: '메모',
      dataIndex: 'memo',
      key: 'memo',
      ellipsis: true,
    },
    {
      title: '작업',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            수정
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          >
            삭제
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <UnifiedModal
      title="예약 관리"
      icon={CalendarOutlined}
      open={open}
      onClose={onClose}
      width={1200}
    >
      <Spin spinning={loading} tip="불러오는 중...">
        <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 16px rgba(25, 118, 210, 0.08)', marginBottom: 24 }}>
          <Tabs defaultActiveKey="list">
            <TabPane tab="예약 목록" key="list">
              <Table
                columns={columns}
                dataSource={Array.isArray(appointments) ? appointments : []}
                loading={loading}
                rowKey="_id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                }}
              />
            </TabPane>
            
            <TabPane tab="예약 등록/수정" key="form">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                style={{ maxWidth: 600 }}
              >
                <Form.Item
                  name="patientName"
                  label="환자명"
                  rules={[{ required: true, message: '환자명을 입력해주세요.' }]}
                >
                  <Input placeholder="환자명을 입력하세요" />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label="연락처"
                  rules={[{ required: true, message: '연락처를 입력해주세요.' }]}
                >
                  <Input placeholder="010-1234-5678" />
                </Form.Item>

                <Form.Item
                  name="appointmentDate"
                  label="예약일"
                  rules={[{ required: true, message: '예약일을 선택해주세요.' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  name="appointmentTime"
                  label="예약시간"
                  rules={[{ required: true, message: '예약시간을 선택해주세요.' }]}
                >
                  <DatePicker.TimePicker style={{ width: '100%' }} format="HH:mm" />
                </Form.Item>

                <Form.Item
                  name="visitType"
                  label="진료유형"
                  rules={[{ required: true, message: '진료유형을 선택해주세요.' }]}
                >
                  <Select placeholder="진료유형을 선택하세요">
                    <Option value="초진">초진</Option>
                    <Option value="재진">재진</Option>
                    <Option value="검사">검사</Option>
                    <Option value="상담">상담</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="memo"
                  label="메모"
                >
                  <Input.TextArea rows={3} placeholder="예약 관련 메모를 입력하세요" />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<PlusOutlined />}
                      style={{ background: '#1976D2', borderRadius: 8, fontWeight: 700, fontSize: 16, padding: '8px 24px', boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)' }}
                    >
                      {editingAppointment ? '수정' : '등록'}
                    </Button>
                    {editingAppointment && (
                      <Button 
                        onClick={() => {
                          setEditingAppointment(null);
                          form.resetFields();
                        }}
                        style={{ borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '8px 24px' }}
                      >
                        취소
                      </Button>
                    )}
                  </Space>
                </Form.Item>
              </Form>
            </TabPane>
          </Tabs>
        </div>
      </Spin>
    </UnifiedModal>
  );
};

export default AppointmentManagerModal; 