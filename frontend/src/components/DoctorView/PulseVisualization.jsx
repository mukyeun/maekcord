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
function classifyPulseByAverage(values, labels, low, high) {
  if (!Array.isArray(values) || values.length === 0) return 'N/A';
  const v = values[0];
  const mid = (low + high) / 2;
  if (v < low) return labels[0];      // 활맥
  if (v > high) return labels[2];     // 삽맥
  return labels[1];                   // 평맥
}

// 81맥상 표기 변환 함수
function to81PulseName(types) {
  const baseNames = types.map(t => t.replace('맥', ''));
  return baseNames.join('') + '맥';
}

const getBarColor = (ratio) => {
  if (ratio > 0.7) return '#FF6B6B'; // 강하게 높음(레드)
  if (ratio > 0.3) return '#FFB347'; // 약간 높음(오렌지)
  if (ratio < -0.7) return '#4FC3F7'; // 강하게 낮음(블루)
  if (ratio < -0.3) return '#00B8A9'; // 약간 낮음(민트)
  return '#BDBDBD'; // 평균 근처(그레이)
};

const BarWrapper = styled.div`
  position: relative;
  width: 120px;
  height: 18px;
  background: #F5F7FA;
  border-radius: 9px;
  margin: 0 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.08);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 16px rgba(24, 144, 255, 0.15);
    transform: translateY(-1px);
  }
`;

const BarFill = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  height: 100%;
  border-radius: 9px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
              background 0.6s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s ease;
  animation: slideIn 0.8s ease-out;
  
  @keyframes slideIn {
    from {
      width: 0;
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ValueLabel = styled.span`
  font-weight: bold;
  color: #222;
  margin-left: 8px;
  transition: all 0.3s ease;
`;

const PulseBar = ({ ratio, value, color }) => (
  <BarWrapper>
    <BarFill
      style={{
        width: `${Math.abs(ratio) * 50}%`,
        background: color,
        left: ratio < 0 ? `calc(50% - ${Math.abs(ratio) * 50}%)` : '50%',
        boxShadow: `0 2px 8px ${color}33`,
      }}
    />
    <div style={{
      position: 'absolute', left: '50%', top: 0, width: 2, height: '100%',
      background: '#888', zIndex: 2
    }} />
    <ValueLabel style={{
      position: 'absolute',
      top: -24,
      left: ratio < 0 ? `calc(50% - ${Math.abs(ratio) * 50}%)` : `calc(50% + ${Math.abs(ratio) * 50}%)`,
      transform: 'translateX(-50%)',
      color: color,
      fontSize: 15,
      textShadow: '0 2px 8px #fff',
      fontWeight: 600,
    }}>
      {value}
    </ValueLabel>
  </BarWrapper>
);

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

  const values = [PVC, BV, SV, HR].filter(v => v !== null && v !== undefined);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const maxDist = max - avg;
  const minDist = avg - min;

  const parameterData = [
    { name: 'PVC', fullName: '말초혈관수축도', value: PVC, ...PULSE_THRESHOLDS.PVC },
    { name: 'BV', fullName: '혈관점탄도', value: BV, ...PULSE_THRESHOLDS.BV },
    { name: 'SV', fullName: '일회박출량', value: SV, ...PULSE_THRESHOLDS.SV },
    { name: 'HR', fullName: '심박동수', value: HR, ...PULSE_THRESHOLDS.HR },
  ]
  .filter(item => item.value !== null && item.value !== undefined && item.LOW !== undefined && item.HIGH !== undefined)
  .map(item => {
    let ratio = 0;
    if (item.value >= avg && maxDist !== 0) {
      ratio = ((item.value - avg) / maxDist);
    } else if (item.value < avg && minDist !== 0) {
      ratio = -((avg - item.value) / minDist);
    }
    // ratio: -1 ~ 1
    const barColor = ratio > 0 ? '#fa541c' : ratio < 0 ? '#1890ff' : '#52c41a';
    const barWidth = Math.abs(ratio * 60); // 최대 60px
    return {
      ...item,
      ratio,
      barColor,
      barWidth,
      originalValue: item.value,
    };
  });

  const pulseTypes = classifyPulse(pulseData);

  // 현재 구조에 맞게 단일값을 배열로 변환하여 평균 기반 분류 계산
  const pvcResult = classifyPulseByAverage(PVC ? [PVC] : [], ['부맥', '평맥', '침맥'], PULSE_THRESHOLDS.PVC.LOW, PULSE_THRESHOLDS.PVC.HIGH);
  const bvResult = classifyPulseByAverage(
    [BV],
    ['활맥', '평맥', '삽맥'],
    7,
    10
  );
  const svResult = classifyPulseByAverage(SV ? [SV] : [], ['허맥', '평맥', '실맥'], PULSE_THRESHOLDS.SV.LOW, PULSE_THRESHOLDS.SV.HIGH);
  const hrResult = classifyPulseByAverage(HR ? [HR] : [], ['지맥', '평맥', '삭맥'], PULSE_THRESHOLDS.HR.LOW, PULSE_THRESHOLDS.HR.HIGH);

  console.log('BV:', BV, 'bvResult:', bvResult, 'parameterData[1]:', parameterData[1]);

  console.log(
    'classifyPulseByAverage([9.46], [활맥, 평맥, 삽맥], 7, 10):',
    classifyPulseByAverage([9.46], ['활맥', '평맥', '삽맥'], 7, 10)
  );

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
                  <PulseBar
                    ratio={param.ratio}
                    value={param.value}
                    color={getBarColor(param.ratio)}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Tag color={getTagColor(param.name)}>{param.name}</Tag>
                  </div>
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
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 120,
                  height: 12,
                  background: '#eee',
                  position: 'relative',
                  margin: '0 8px'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: parameterData[0]?.ratio < 0 ? '50%' : '50%',
                    top: 0,
                    width: `${Math.abs(parameterData[0]?.ratio * 60)}px`,
                    height: '100%',
                    background: parameterData[0]?.barColor,
                    transform: parameterData[0]?.ratio < 0 ? 'translateX(-100%)' : 'none'
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    width: 2,
                    height: '100%',
                    background: '#888'
                  }} />
                </div>
                <span style={{ fontWeight: 'bold' }}>{PVC}</span>
                <Tag color={getTagColor(pvcResult.summary || pvcResult)}>{pvcResult.summary || pvcResult}</Tag>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="혈관점탄도 (BV)">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 120,
                  height: 12,
                  background: '#eee',
                  position: 'relative',
                  margin: '0 8px'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    width: `${parameterData[1]?.barWidth}px`,
                    height: '100%',
                    background: parameterData[1]?.barColor,
                    transform: parameterData[1]?.ratio < 0 ? 'translateX(-100%)' : 'none'
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    width: 2,
                    height: '100%',
                    background: '#888'
                  }} />
                </div>
                <span style={{ fontWeight: 'bold' }}>{BV}</span>
                <Tag color={getTagColor(bvResult)}>{bvResult}</Tag>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="일회박출량 (SV)">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 120,
                  height: 12,
                  background: '#eee',
                  position: 'relative',
                  margin: '0 8px'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: parameterData[2]?.ratio < 0 ? '50%' : '50%',
                    top: 0,
                    width: `${Math.abs(parameterData[2]?.ratio * 60)}px`,
                    height: '100%',
                    background: parameterData[2]?.barColor,
                    transform: parameterData[2]?.ratio < 0 ? 'translateX(-100%)' : 'none'
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    width: 2,
                    height: '100%',
                    background: '#888'
                  }} />
                </div>
                <span style={{ fontWeight: 'bold' }}>{SV}</span>
                <Tag color={getTagColor(svResult.summary || svResult)}>{svResult.summary || svResult}</Tag>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="심박동수 (HR)">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 120,
                  height: 12,
                  background: '#eee',
                  position: 'relative',
                  margin: '0 8px'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: parameterData[3]?.ratio < 0 ? '50%' : '50%',
                    top: 0,
                    width: `${Math.abs(parameterData[3]?.ratio * 60)}px`,
                    height: '100%',
                    background: parameterData[3]?.barColor,
                    transform: parameterData[3]?.ratio < 0 ? 'translateX(-100%)' : 'none'
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    width: 2,
                    height: '100%',
                    background: '#888'
                  }} />
                </div>
                <span style={{ fontWeight: 'bold' }}>{HR}</span>
                <Tag color={getTagColor(hrResult.summary || hrResult)}>{hrResult.summary || hrResult}</Tag>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="종합 맥상" span={2}>
              <Space>
                <Tag color="purple" style={{ fontSize: '16px', padding: '5px 10px' }}>
                  {combinedPulse}
                </Tag>
                {combinedPulse && combinedPulse !== '평맥' && (
                  <PulseInfoButton 
                    pulseType={combinedPulse}
                    patientPulseData={{
                      PVC: PVC,
                      BV: BV,
                      SV: SV,
                      HR: HR
                    }}
                  >
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
