import React from 'react';
import { Descriptions } from 'antd';

const PatientSummary = ({ patient }) => {
  return (
    <Descriptions bordered size="small">
      <Descriptions.Item label="이름">{patient?.basicInfo?.name || '-'}</Descriptions.Item>
      <Descriptions.Item label="생년월일">{patient?.basicInfo?.birthDate || '-'}</Descriptions.Item>
      <Descriptions.Item label="연락처">{patient?.basicInfo?.phone || '-'}</Descriptions.Item>
      <Descriptions.Item label="방문유형">{patient?.basicInfo?.visitType || '-'}</Descriptions.Item>
    </Descriptions>
  );
};

export default PatientSummary; 