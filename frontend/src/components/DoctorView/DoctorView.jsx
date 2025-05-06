import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Card, Tag, Progress, Space, Input, Checkbox, DatePicker, Button, message } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  DoctorViewContainer,
  PatientInfoSection,
  AnalysisSection,
  PulseSection,
  RecommendationSection,
  ConsultationSection,
  TreatmentSection,
  InfoGrid,
  StyledCard,
  ChartContainer,
  GaugeContainer,
  TagContainer
} from './styles';

const { TextArea } = Input;
const { TabPane } = Tabs;

const DoctorView = ({ visible, onClose }) => {
  const [patientData, setPatientData] = useState({
    basicInfo: {
      name: '김환자',
      birthDate: '1990-01-01',
      gender: '남',
      phone: '010-1234-5678',
      visitHistory: ['2024-01-15', '2024-02-01']
    },
    constitution: {
      bmi: 22.5,
      type: '소양인',
      characteristics: ['활동적', '외향적', '열성적']
    },
    symptoms: ['두통', '어지러움', '불면'],
    stress: {
      total: 75,
      level: '높음'
    },
    pulseAnalysis: {
      measurements: {
        'a-b': 0.8,
        'a-c': 1.2,
        'a-d': 0.9,
        'a-e': 1.1,
        'HR': 72,
        'PVC': 65,
        'BV': 4500,
        'SV': 70
      },
      timeSeriesData: [
        { time: '0', value: 1.2 },
        { time: '1', value: 1.4 },
        { time: '2', value: 1.1 },
        // ... 더 많은 시계열 데이터
      ]
    },
    recommendations: [
      {
        type: '현맥',
        matchRate: 85,
        symptoms: ['두통', '어지러움'],
        organs: ['심장', '비장']
      },
      {
        type: '삭맥',
        matchRate: 75,
        symptoms: ['불면', '피로'],
        organs: ['간장', '신장']
      },
      {
        type: '부맥',
        matchRate: 70,
        symptoms: ['소화불량', '복통'],
        organs: ['위장', '대장']
      }
    ]
  });

  const [consultation, setConsultation] = useState({
    memo: '',
    treatments: {
      acupuncture: false,
      herbalMedicine: false,
      moxibustion: false,
      chuna: false
    },
    nextAppointment: null
  });

  useEffect(() => {
    if (visible) {
      // fetchPatientData(); // 실제 API 연동 시 활성화
    }
  }, [visible]);

  const handleSave = async () => {
    try {
      // await saveConsultation(consultation); // 실제 API 연동 시 활성화
      message.success('진료 기록이 저장되었습니다.');
      onClose();
    } catch (error) {
      message.error('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <Modal
      title="진료실"
      open={visible}
      onCancel={onClose}
      width="90%"
      style={{ top: 20 }}
      footer={[
        <Button key="save" type="primary" onClick={handleSave}>
          저장
        </Button>
      ]}
    >
      <DoctorViewContainer>
        <Tabs defaultActiveKey="1">
          <TabPane tab="환자 정보" key="1">
            <PatientInfoSection>
              <StyledCard title="기본 정보">
                <InfoGrid>
                  <div>이름: {patientData.basicInfo.name}</div>
                  <div>생년월일: {patientData.basicInfo.birthDate}</div>
                  <div>성별: {patientData.basicInfo.gender}</div>
                  <div>연락처: {patientData.basicInfo.phone}</div>
                </InfoGrid>
              </StyledCard>

              <StyledCard title="체질 분석">
                <InfoGrid>
                  <div>BMI: {patientData.constitution.bmi}</div>
                  <div>체질 유형: {patientData.constitution.type}</div>
                  <TagContainer>
                    {patientData.constitution.characteristics.map(char => (
                      <Tag key={char}>{char}</Tag>
                    ))}
                  </TagContainer>
                </InfoGrid>
              </StyledCard>
            </PatientInfoSection>
          </TabPane>

          <TabPane tab="분석 결과" key="2">
            <AnalysisSection>
              <StyledCard title="증상 및 스트레스">
                <TagContainer>
                  {patientData.symptoms.map(symptom => (
                    <Tag key={symptom} color="blue">{symptom}</Tag>
                  ))}
                </TagContainer>
                <Progress 
                  percent={patientData.stress.total} 
                  status="active"
                  format={() => patientData.stress.level}
                />
              </StyledCard>

              <StyledCard title="맥파 분석">
                <ChartContainer>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={patientData.pulseAnalysis.timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </StyledCard>
            </AnalysisSection>
          </TabPane>

          <TabPane tab="진단 및 치료" key="3">
            <ConsultationSection>
              <StyledCard title="81맥상 추천">
                {patientData.recommendations.map(rec => (
                  <Card key={rec.type} size="small" style={{ marginBottom: 16 }}>
                    <h4>{rec.type} (일치율: {rec.matchRate}%)</h4>
                    <p>주요 증상: {rec.symptoms.join(', ')}</p>
                    <p>관련 장부: {rec.organs.join(', ')}</p>
                  </Card>
                ))}
              </StyledCard>

              <StyledCard title="상담 기록">
                <TextArea
                  rows={4}
                  value={consultation.memo}
                  onChange={e => setConsultation({ ...consultation, memo: e.target.value })}
                  placeholder="상담 내용을 입력하세요..."
                />
              </StyledCard>

              <StyledCard title="치료 계획">
                <Space direction="vertical">
                  <Checkbox
                    checked={consultation.treatments.acupuncture}
                    onChange={e => setConsultation({
                      ...consultation,
                      treatments: { ...consultation.treatments, acupuncture: e.target.checked }
                    })}
                  >
                    침
                  </Checkbox>
                  <Checkbox
                    checked={consultation.treatments.herbalMedicine}
                    onChange={e => setConsultation({
                      ...consultation,
                      treatments: { ...consultation.treatments, herbalMedicine: e.target.checked }
                    })}
                  >
                    한약
                  </Checkbox>
                  <Checkbox
                    checked={consultation.treatments.moxibustion}
                    onChange={e => setConsultation({
                      ...consultation,
                      treatments: { ...consultation.treatments, moxibustion: e.target.checked }
                    })}
                  >
                    뜸
                  </Checkbox>
                  <Checkbox
                    checked={consultation.treatments.chuna}
                    onChange={e => setConsultation({
                      ...consultation,
                      treatments: { ...consultation.treatments, chuna: e.target.checked }
                    })}
                  >
                    추나
                  </Checkbox>
                </Space>
              </StyledCard>

              <StyledCard title="다음 예약">
                <DatePicker
                  value={consultation.nextAppointment}
                  onChange={date => setConsultation({ ...consultation, nextAppointment: date })}
                  style={{ width: '100%' }}
                />
              </StyledCard>
            </ConsultationSection>
          </TabPane>
        </Tabs>
      </DoctorViewContainer>
    </Modal>
  );
};

export default DoctorView; 