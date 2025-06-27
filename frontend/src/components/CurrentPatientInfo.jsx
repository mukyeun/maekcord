import React from 'react';
import { Card, Descriptions } from 'antd';
import styled from 'styled-components';

const InfoCard = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(25, 118, 210, 0.08);
  border: 1px solid ${({ theme }) => theme.border};
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.text};
  @media (max-width: 700px) {
    padding: 1rem;
  }
`;

const CurrentPatientInfo = ({ patient }) => {
  if (!patient) return null;

  const { basicInfo = {}, medication = {}, symptoms = [], records = {}, memo = '' } = patient;
  const { name, gender, birthDate, contact = {} } = basicInfo;
  const { phone } = contact;
  const { current = [], preferences = [] } = medication;
  const { stress = {}, pulse = {} } = records;

  console.log('CurrentPatientInfo patient:', patient);

  return (
    <InfoCard>
      <Card title="현재 환자 정보" style={{ marginBottom: 16, background: 'transparent', boxShadow: 'none', border: 'none' }}>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="이름">{name || '-'}</Descriptions.Item>
          <Descriptions.Item label="성별">{gender || '-'}</Descriptions.Item>
          <Descriptions.Item label="생년월일">{birthDate || '-'}</Descriptions.Item>
          <Descriptions.Item label="연락처">{phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="약물(현재)">
            {current.length > 0 ? current.join(', ') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="약물(선호)">
            {preferences.length > 0 ? preferences.join(', ') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="증상">
            {symptoms.length > 0 ? symptoms.join(', ') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="스트레스">
            {stress.score !== undefined
              ? `점수: ${stress.score}, 레벨: ${stress.level || '-'}`
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="맥파 분석">
            {pulse.values
              ? `HR: ${pulse.values.HR || '-'}, HRV: ${pulse.values.HRV || '-'}, BV: ${pulse.values.BV || '-'}`
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="메모">{memo || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </InfoCard>
  );
};

export default CurrentPatientInfo; 