import React from 'react';
import { Card, Typography, Tag, Row, Col, Descriptions, Space, Button } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import styled from 'styled-components';
import { BookOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ResultCard = styled(Card)`
  .ant-card-head {
    background-color: #f0f8ff;
  }
`;

// 팔요맥 분류 기준 (향후 DB에서 가져오거나 동적으로 계산할 수 있도록 상수로 분리)
const PULSE_THRESHOLDS = {
  PVC: { LOW: 60, HIGH: 90 }, // 부맥/평맥/침맥
  // BV, SV, HR은 "강/중/약" → 삽맥/평맥/활맥 등으로 맵핑
  BV: { LOW: 7, HIGH: 10 },   // 활맥/평맥/삽맥
  SV: { LOW: 55, HIGH: 70 },  // 허맥/평맥/실맥
  HR: { LOW: 65, HIGH: 85 },  // 지맥/평맥/삭맥
};

// Tooltip 커스텀
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

// 팔요맥 분류 로직
const classifyPulse = (pulseData) => {
  const { PVC, BV, SV, HR } = pulseData;
  const th = PULSE_THRESHOLDS;

  // 강/중/약 → 한글 맥상명으로 변환
  const classify = (value, low, high, labels) => {
    if (value === null || value === undefined) return '측정 안됨';
    if (value < low) return labels.weak;   // 약
    if (value > high) return labels.strong; // 강
    return labels.medium; // 중
  };
  
  // 요구사항 테이블에 맞춘 레이블
  // 강: 침맥, 삽맥, 실맥, 삭맥
  // 약: 부맥, 활맥, 허맥, 지맥
  return {
    PVC: classify(PVC, th.PVC.LOW, th.PVC.HIGH, { weak: '부맥(약)', medium: '평맥(중)', strong: '침맥(강)' }),
    BV: classify(BV, th.BV.LOW, th.BV.HIGH, { weak: '활맥(약)', medium: '평맥(중)', strong: '삽맥(강)' }),
    SV: classify(SV, th.SV.LOW, th.SV.HIGH, { weak: '허맥(약)', medium: '평맥(중)', strong: '실맥(강)' }),
    HR: classify(HR, th.HR.LOW, th.HR.HIGH, { weak: '지맥(약)', medium: '평맥(중)', strong: '삭맥(강)' }),
  };
};

const PulseVisualization = ({ pulseData = {}, onShowProfile }) => {
  const {
    'a-b': a_b, 'a-c': a_c, 'a-d': a_d, 'a-e': a_e,
    'b/a': b_a, 'c/a': c_a, 'd/a': d_a, 'e/a': e_a,
    PVC, BV, SV, HR,
  } = pulseData;

  // 거리값 데이터 (a-b, a-c, a-d, a-e)
  const distanceData = [
    { name: 'a-b', value: a_b }, { name: 'a-c', value: a_c },
    { name: 'a-d', value: a_d }, { name: 'a-e', value: a_e },
  ].filter(item => item.value !== null && item.value !== undefined);

  // 비율값 데이터 (b/a, c/a, d/a, e/a)
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

  // 종합 맥상 계산 로직
  const calculateCombinedPulse = (types) => {
    const order = ['PVC', 'BV', 'SV', 'HR'];
    const significantPulseInitials = order
      .map(key => types[key]) // 정의된 순서대로 맥상 타입을 가져옴
      .filter(type => type && !type.includes('평맥')) // '평맥'이 아닌 유의미한 맥상만 필터링
      .map(type => type.charAt(0)); // 각 맥상의 첫 글자 추출 (예: '부맥' -> '부')

    if (significantPulseInitials.length === 0) {
      return '평맥'; // 모든 맥상이 '평맥'일 경우
    }
    
    // 중복된 이니셜을 제거하여 최종 맥상 조합 생성 (예: ['부', '허'] -> '부허맥')
    const uniqueInitials = [...new Set(significantPulseInitials)];
    return uniqueInitials.join('') + '맥';
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
    if (normalizedValue > 0) return '#f06261'; // 양성/강함 (붉은 계열)
    if (normalizedValue < 0) return '#619fef'; // 음성/약함 (푸른 계열)
    return '#888'; // 중간
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
              <Tag color={getTagColor(pulseTypes.PVC)}>{pulseTypes.PVC}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="혈관점탄도 (BV)">
              <Tag color={getTagColor(pulseTypes.BV)}>{pulseTypes.BV}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="일회박출량 (SV)">
              <Tag color={getTagColor(pulseTypes.SV)}>{pulseTypes.SV}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="심박동수 (HR)">
              <Tag color={getTagColor(pulseTypes.HR)}>{pulseTypes.HR}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="종합 맥상" span={2}>
              <Space>
                <Tag color="purple" style={{ fontSize: '16px', padding: '5px 10px' }}>
                  {combinedPulse}
                </Tag>
                {combinedPulse !== '평맥' && (
                  <Button
                    size="small"
                    icon={<BookOutlined />}
                    onClick={() => onShowProfile(combinedPulse)}
                  >
                    맥상정보 보기
                  </Button>
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
