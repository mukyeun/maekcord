import React from 'react';
import { Card, Table, Typography } from 'antd';

const { Title } = Typography;

const PatientSummary = ({ data }) => {
  const { basicInfo, medicalInfo, symptoms, memo } = data;

  // 기본 정보 테이블
  const basicInfoData = [
    { label: '이름', value: basicInfo.name },
    { label: '주민번호', value: basicInfo.residentNumber },
    { label: '연락처', value: basicInfo.contact?.phone },
    { label: '성별', value: basicInfo.gender },
    { label: '성격', value: basicInfo.personality },
    { label: '노동강도', value: basicInfo.workIntensity },
    { label: '신장', value: `${basicInfo.height} cm` },
    { label: '체중', value: `${basicInfo.weight} kg` },
    { label: 'BMI', value: basicInfo.bmi },
  ];

  // 약물 및 기호식품
  const meds = (medicalInfo.medications?.current || []).join(', ');
  const prefs = (medicalInfo.medications?.preferences || []).join(', ');

  // 증상
  const symptomTags = (symptoms || []).join(', ');

  // 스트레스
  const stress = medicalInfo.stress || {};
  const stressLevel = stress.level || '-';

  // 맥파
  const pulse = medicalInfo.pulse?.values || {};
  const pulseData = [
    { label: '수축기 혈압', value: pulse.systolic },
    { label: '이완기 혈압', value: pulse.diastolic },
    { label: '심박수 (HR)', value: pulse.HR },
    { label: '맥압', value: pulse.pulsePressure },
    { label: 'a-b', value: pulse['a-b'] },
    { label: 'a-c', value: pulse['a-c'] },
    { label: 'a-d', value: pulse['a-d'] },
    { label: 'a-e', value: pulse['a-e'] },
    { label: 'b/a', value: pulse['b/a'] },
    { label: 'c/a', value: pulse['c/a'] },
    { label: 'd/a', value: pulse['d/a'] },
    { label: 'e/a', value: pulse['e/a'] },
    { label: 'PVC', value: pulse.PVC },
    { label: 'BV', value: pulse.BV },
    { label: 'SV', value: pulse.SV },
  ];

  const renderTable = (title, dataArray) => (
    <Card style={{ marginBottom: 16 }}>
      <Title level={4}>{title}</Title>
      <Table
        size="small"
        dataSource={dataArray.map((item, i) => ({ ...item, key: i }))}
        columns={[
          { title: '항목', dataIndex: 'label', key: 'label', width: 150 },
          { title: '값', dataIndex: 'value', key: 'value' },
        ]}
        pagination={false}
        bordered
      />
    </Card>
  );

  return (
    <>
      {renderTable('1. 기본 정보', basicInfoData)}
      {renderTable('2. 복용 약물 및 기호식품', [
        { label: '복용 약물', value: meds || '없음' },
        { label: '기호식품', value: prefs || '없음' },
      ])}
      {renderTable('3. 증상', [{ label: '선택된 증상', value: symptomTags || '없음' }])}
      {renderTable('4. 스트레스 평가', [{ label: '스트레스 수준', value: stressLevel }])}
      {renderTable('5. 맥파 분석', pulseData)}
      {renderTable('6. 메모', [{ label: '메모 내용', value: memo || '없음' }])}
    </>
  );
};

export default PatientSummary;