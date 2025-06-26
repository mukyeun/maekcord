import React from 'react';
import { Card, Typography, Tag, Row, Col, Descriptions, Space, Button } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import styled from 'styled-components';
import PulseInfoButton from '../PulseInfoButton';

const { Title, Text } = Typography;

const ResultCard = styled(Card)`
  .ant-card-head {
    background-color: #f0f8ff;
  }
`;

const PULSE_THRESHOLDS = {
  PVC: { LOW: 60, HIGH: 90 },
  BV: { LOW: 7, HIGH: 10 },
  SV: { LOW: 55, HIGH: 70 },
  HR: { LOW: 65, HIGH: 85 },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
        <p style={{ margin: 0 }}>{`측정값: ${data.originalValue}`}</p>
        <p style={{ margin: 0 }}>{`정상범위: ${data.LOW} ~ ${data.HIGH}`}</p>
      </div>
    );
  }
  return null;
};

const classifyPulse = (pulseData) => {
  const { PVC, BV, SV, HR } = pulseData;
  const th = PULSE_THRESHOLDS;

  const classify = (value, low, high, labels) => {
    if (value === null || value === undefined) return '측정 안됨';
    if (value < low) return labels.weak;
    if (value > high) return labels.strong;
    return labels.medium;
  };
  
  return {
    PVC: classify(PVC, th.PVC.LOW, th.PVC.HIGH, { weak: '부맥', medium: '평맥', strong: '침맥' }),
    BV: classify(BV, th.BV.LOW, th.BV.HIGH, { weak: '활맥', medium: '평맥', strong: '삽맥' }),
    SV: classify(SV, th.SV.LOW, th.SV.HIGH, { weak: '허맥', medium: '평맥', strong: '실맥' }),
    HR: classify(HR, th.HR.LOW, th.HR.HIGH, { weak: '지맥', medium: '평맥', strong: '삭맥' }),
  };
};

// 평균값 기반 분류 함수
function classifyPulseByAverage(values, labels) {
  if (!Array.isArray(values) || values.length === 0) return 'N/A';
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  // 단일값만 있으면 기존 방식과 동일하게
  if (values.length === 1) {
    const v = values[0];
    if (v < avg) return labels[0];
    if (v === avg) return labels[1];
    return labels[2];
  }
  // 여러 값이면 각 값의 분류도 보여줄 수 있음
  return {
    avg,
    type: values.map(v => {
      if (v < avg) return labels[0];
      if (v === avg) return labels[1];
      return labels[2];
    }),
    summary: (avg < values[0]) ? labels[0] : (avg > values[0]) ? labels[2] : labels[1]
  };
}

// 81맥상 표기 변환 함수
function to81PulseName(types) {
  const baseNames = types.map(t => t.replace('맥', ''));
  return baseNames.join('') + '맥';
}

const PulseVisualization = ({ pulseData = {} }) => {
  const {
    'a-b': a_b, 'a-c': a_c, 'a-d': a_d, 'a-e': a_e,
    'b/a': b_a, 'c/a': c_a, 'd/a': d_a, 'e/a': e_a,
    PVC, BV, SV, HR,
  } = pulseData;

  const distanceData = [
    { name: 'a-b', value: a_b }, { name: 'a-c', value: a_c },
    { name: 'a-d', value: a_d }, { name: 'a-e', value: a_e },
  ].filter(item => item.value !== null && item.value !== undefined);

  const ratioData = [
    { name: 'b/a', value: b_a }, { name: 'c/a', value: c_a },
    { name: 'd/a', value: d_a }, { name: 'e/a', value: e_a },
  ].filter(item => item.value !== null && item.value !== undefined);

  const parameterData = [
    { name: 'PVC', fullName: '말초혈관수축도', value: PVC, ...PULSE_THRESHOLDS.PVC },
    { name: 'BV', fullName: '혈관점탄도', value: BV, ...PULSE_THRESHOLDS.BV },
    { name: 'SV', fullName: '일회박출량', value: SV, ...PULSE_THRESHOLDS.SV },
    { name: 'HR', fullName: '심박동수', value: HR, ...PULSE_THRESHOLDS.HR },
  ]
  .filter(item => item.value !== null && item.value !== undefined && item.LOW !== undefined && item.HIGH !== undefined)
  .map(item => {
    const mid = (item.LOW + item.HIGH) / 2;
    const range = (item.HIGH - item.LOW) / 2;
    const normalizedValue = range > 0 ? (item.value - mid) / range : 0;
    
    return {
      ...item,
      normalizedValue,
      originalValue: item.value,
    };
  });

  const pulseTypes = classifyPulse(pulseData);

  // 현재 구조에 맞게 단일값을 배열로 변환하여 평균 기반 분류 계산
  const pvcResult = classifyPulseByAverage(PVC ? [PVC] : [], ['부맥', '중맥', '침맥']);
  const bvResult = classifyPulseByAverage(BV ? [BV] : [], ['활맥', '중맥', '삽맥']);
  const svResult = classifyPulseByAverage(SV ? [SV] : [], ['허맥', '중맥', '실맥']);
  const hrResult = classifyPulseByAverage(HR ? [HR] : [], ['지맥', '중맥', '삭맥']);

  const calculateCombinedPulse = (types) => {
    const order = ['PVC', 'BV', 'SV', 'HR'];
    const significantRaw = order
      .map(key => types[key])
      .filter(type => type && !type.includes('평맥'));

    if (significantRaw.length === 0) return '평맥';

    const pulseMap = new Map([
      [['부맥', '허맥'].join(), "부허맥"],
      [['부맥', '삭맥', '활맥', '실맥'].join(), "부삭활실맥"],
      [['부맥', '삭맥', '활맥', '허맥'].join(), "부삭활허맥"],
      [['부맥', '삭맥', '삽맥', '실맥'].join(), "부삭삽실맥"],
      [['부맥', '삭맥', '삽맥', '허맥'].join(), "부삭삽허맥"],
      [['부맥', '지맥', '활맥', '실맥'].join(), "부지활실맥"],
      [['부맥', '지맥', '활맥', '허맥'].join(), "부지활허맥"],
      [['부맥', '지맥', '삽맥', '실맥'].join(), "부지삽실맥"],
      [['부맥', '지맥', '삽맥', '허맥'].join(), "부지삽허맥"],
      [['침맥', '삭맥', '활맥', '실맥'].join(), "침삭활실맥"],
      [['침맥', '삭맥', '활맥', '허맥'].join(), "침삭활허맥"],
      [['침맥', '삭맥', '삽맥', '실맥'].join(), "침삭삽실맥"],
      [['침맥', '삭맥', '삽맥', '허맥'].join(), "침삭삽허맥"],
      [['침맥', '지맥', '활맥', '실맥'].join(), "침지활실맥"],
      [['침맥', '지맥', '활맥', '허맥'].join(), "침지활허맥"],
      [['침맥', '지맥', '삽맥', '실맥'].join(), "침지삽실맥"],
      [['침맥', '지맥', '삽맥', '허맥'].join(), "침지삽허맥"],
      [['부맥', '삽맥', '허맥'].join(), "부삽허맥"],
      [['부맥', '삽맥', '지맥', '허맥'].join(), "부삽허지맥"],
      [['부맥', '활맥'].join(), "부활맥"],
      [['부맥', '삽맥'].join(), "부삽맥"],
    ]);
    
    const key = significantRaw.join();
    if (pulseMap.has(key)) {
      return pulseMap.get(key);
    }
    
    if (significantRaw.length === 1) {
      return significantRaw[0];
    }

    return to81PulseName(significantRaw);
  };

  const combinedPulse = calculateCombinedPulse(pulseTypes);

  const getTagColor = (pulseType) => {
    if (!pulseType) return 'default';
    if (pulseType.includes('평맥')) return 'green';
    if (pulseType.includes('부맥') || pulseType.includes('활맥') || pulseType.includes('허맥') || pulseType.includes('지맥')) return 'blue';
    if (pulseType.includes('침맥') || pulseType.includes('삽맥') || pulseType.includes('실맥') || pulseType.includes('삭맥')) return 'red';
    return 'default';
  };

  const getParameterBarColor = (normalizedValue) => {
    if (normalizedValue > 0) return '#f06261';
    if (normalizedValue < 0) return '#619fef';
    return '#888';
  };

  return (
    <Row gutter={[16, 16]}>
      <Col span={12}>
        <Card>
          <Title level={4}>맥파 변곡점 간 거리 (ms)</Title>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={distanceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
      <Col span={12}>
        <Card>
          <Title level={4}>맥파 변곡점 간 비율</Title>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ratioData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
      <Col span={24}>
        <Card>
          <Title level={4}>4대 생리 매개변수</Title>
          <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
            {parameterData.map((param) => (
              <Col span={6} key={param.name}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>{param.fullName}</Text>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={[param]}
                      margin={{ top: 20, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide />
                      <YAxis
                        domain={[-2.5, 2.5]}
                        ticks={[-1, 0, 1]}
                        tickFormatter={(tick) => {
                          if (tick === -1) return '약';
                          if (tick === 0) return '평균';
                          if (tick === 1) return '강';
                          return '';
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceArea y1={1} y2={2.5} fill="#f8d7da" strokeOpacity={0.3} />
                      <ReferenceArea y1={-1} y2={1} fill="#fff3cd" strokeOpacity={0.3} />
                      <ReferenceArea y1={-2.5} y2={-1} fill="#cce5ff" strokeOpacity={0.3} />
                      <ReferenceLine y={0} stroke="#000" />
                      <Bar dataKey="normalizedValue" fill={getParameterBarColor(param.normalizedValue)} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      </Col>
      <Col span={24}>
        <ResultCard>
          <Title level={4}>팔요맥 분류 결과</Title>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="말초혈관수축도 (PVC)">
              <Tag color={getTagColor(pvcResult.summary || pvcResult)}>{pvcResult.summary || pvcResult}</Tag>
              {pvcResult.avg && (
                <span style={{fontSize:12, color:'#888'}}> (평균: {pvcResult.avg.toFixed(2)})</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="혈관점탄도 (BV)">
              <Tag color={getTagColor(bvResult.summary || bvResult)}>{bvResult.summary || bvResult}</Tag>
              {bvResult.avg && (
                <span style={{fontSize:12, color:'#888'}}> (평균: {bvResult.avg.toFixed(2)})</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="일회박출량 (SV)">
              <Tag color={getTagColor(svResult.summary || svResult)}>{svResult.summary || svResult}</Tag>
              {svResult.avg && (
                <span style={{fontSize:12, color:'#888'}}> (평균: {svResult.avg.toFixed(2)})</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="심박동수 (HR)">
              <Tag color={getTagColor(hrResult.summary || hrResult)}>{hrResult.summary || hrResult}</Tag>
              {hrResult.avg && (
                <span style={{fontSize:12, color:'#888'}}> (평균: {hrResult.avg.toFixed(2)})</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="종합 맥상" span={2}>
              <Space>
                <Tag color="purple" style={{ fontSize: '16px', padding: '5px 10px' }}>
                  {combinedPulse}
                </Tag>
                {combinedPulse && combinedPulse !== '평맥' && (
                  <PulseInfoButton pulseType={combinedPulse}>
                    맥상정보 보기
                  </PulseInfoButton>
                )}
              </Space>
            </Descriptions.Item>
          </Descriptions>
          <Text type="secondary" style={{ marginTop: '1rem', display: 'block' }}>
            * BV, SV, HR의 분류 기준(상한/하한)은 현재 예시값이며, 향후 축적된 데이터에 따라 동적으로 조정될 예정입니다.
          </Text>
        </ResultCard>
      </Col>
    </Row>
  );
};

export default PulseVisualization;
