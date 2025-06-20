import React from 'react';
import { Card, Typography, Tag } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const { Title } = Typography;

const PulseVisualization = ({ pulseData = {} }) => {
  const {
    'a-b': aToB,
    'a-c': aToC,
    'a-d': aToD,
    'a-e': aToE,
    'b/a': bOverA,
    'c/a': cOverA,
    'd/a': dOverA,
    'e/a': eOverA,
    PVC,
    BV,
    SV,
    HR,
  } = pulseData;

  const inflectionData = [
    { name: 'a-b', value: aToB },
    { name: 'a-c', value: aToC },
    { name: 'a-d', value: aToD },
    { name: 'a-e', value: aToE },
    { name: 'b/a', value: bOverA },
    { name: 'c/a', value: cOverA },
    { name: 'd/a', value: dOverA },
    { name: 'e/a', value: eOverA },
  ];

  const parameterData = [
    { name: 'PVC', value: PVC },
    { name: 'BV', value: BV },
    { name: 'SV', value: SV },
    { name: 'HR', value: HR },
  ];

  // 팔요맥 분류 기준
  const classifyPulse = () => {
    const classify = (value, low, high, labels) => {
      if (value < low) return labels[0];
      if (value > high) return labels[2];
      return labels[1];
    };

    return {
      PVC: classify(PVC, 60, 90, ['부맥', '평맥', '침맥']),
      BV: classify(BV, 7, 10, ['삽맥', '평맥', '활맥']),
      SV: classify(SV, 55, 70, ['허맥', '평맥', '실맥']),
      HR: classify(HR, 65, 85, ['지맥', '평맥', '삭맥']),
    };
  };

  const pulseTypes = classifyPulse();

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>맥파 변곡점 분석</Title>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={inflectionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>생리 매개변수 (4대)</Title>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={parameterData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <Title level={4}>팔요맥 분류 결과</Title>
        <p><strong>PVC:</strong> <Tag color="blue">{pulseTypes.PVC}</Tag></p>
        <p><strong>BV:</strong> <Tag color="green">{pulseTypes.BV}</Tag></p>
        <p><strong>SV:</strong> <Tag color="purple">{pulseTypes.SV}</Tag></p>
        <p><strong>HR:</strong> <Tag color="red">{pulseTypes.HR}</Tag></p>
      </Card>
    </>
  );
};

export default PulseVisualization;
