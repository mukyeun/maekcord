import React, { useState, useEffect } from 'react';
import { Card, Typography, Tag, Row, Col, Descriptions, Space, Button, Divider } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import styled from 'styled-components';
import PulseInfoButton from '../PulseInfoButton';
import * as pulseApi from '../../api/pulseApi';

const { Title, Text } = Typography;

const ResultCard = styled(Card)`
  .ant-card-head {
    background-color: #f0f8ff;
  }
`;

const ClassificationRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
`;

const ParameterInfo = styled.div`
  width: 180px;
  display: flex;
  flex-direction: column;
`;

const ParameterName = styled.div`
  font-size: 13px;
  color: #666;
`;

const ParameterValue = styled.div`
  font-size: 14px;
  font-weight: bold;
`;

const BarContainer = styled.div`
  flex: 1;
  height: 4px;
  background: #f5f5f5;
  position: relative;
  margin: 0 20px;
`;

const CenterLine = styled.div`
  position: absolute;
  left: 50%;
  top: -8px;
  width: 1px;
  height: 20px;
  background: #ddd;
  transform: translateX(-50%);
`;

const ValueMarker = styled.div`
  position: absolute;
  width: 2px;
  height: 16px;
  background: #1890ff;
  top: -6px;
  transform: translateX(-50%);
`;

const RangeValue = styled.div`
  position: absolute;
  font-size: 12px;
  color: #999;
  top: -25px;
`;

const ValueText = styled.span`
  color: #1890ff;
  font-weight: bold;
  margin-left: 8px;
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

const PARAMETER_RANGES = {
  PVC: { min: 20.98, max: 38.07, mean: 29.53 },
  BV: { min: 8.07, max: 10.27, mean: 9.17 },
  SV: { min: 6.45, max: 11.41, mean: 8.93 },
  HR: { min: 50.00, max: 107.00, mean: 78.50 }
};

const classifyPulse = (pulseData) => {
  const { PVC, BV, SV, HR } = pulseData;

  const classify = (value, range, labels) => {
    if (value === null || value === undefined) return '측정 안됨';
    
    const { min, max, mean } = range;
    const stdDev = (max - min) / 4; // 표준편차 근사값
    
    // 평균에서 표준편차 이상 벗어난 경우에만 강/약으로 분류
    if (value < mean - stdDev) return labels.weak;
    if (value > mean + stdDev) return labels.strong;
    return labels.medium;
  };
  
  return {
    PVC: classify(PVC, PARAMETER_RANGES.PVC, { weak: '부맥', medium: '평맥', strong: '침맥' }),
    BV: classify(BV, PARAMETER_RANGES.BV, { weak: '활맥', medium: '평맥', strong: '삽맥' }),
    SV: classify(SV, PARAMETER_RANGES.SV, { weak: '허맥', medium: '평맥', strong: '실맥' }),
    HR: classify(HR, PARAMETER_RANGES.HR, { weak: '지맥', medium: '평맥', strong: '삭맥' }),
  };
};

// 평균값 기반 분류 함수
function classifyPulseByAverage(values, labels, low, high) {
  if (!Array.isArray(values) || values.length === 0) return 'N/A';
  const v = values[0];
  const mid = (low + high) / 2;
  const range = high - low;
  const threshold = range * 0.3; // 30% threshold for classification

  if (v < low + threshold) return labels[0];      // 활맥
  if (v > high - threshold) return labels[2];     // 삽맥
  return labels[1];                               // 평맥
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
  background: #f0f0f0;
  margin: 0 8px;
  overflow: visible;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const BarFill = styled.div`
  position: absolute;
  top: 0;
  height: 100%;
  background: ${props => props.color};
  transition: all 0.3s ease;
`;

const MinMaxLine = styled.div`
  position: absolute;
  top: -4px;
  width: 2px;
  height: 26px;
  background: #666;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -4px;
    width: 10px;
    height: 2px;
    background: #666;
  }
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: -4px;
    width: 10px;
    height: 2px;
    background: #666;
  }
`;

const ValueLabel = styled.span`
  position: absolute;
  top: -24px;
  font-size: 12px;
  color: #666;
  white-space: nowrap;
`;

const PulseBar = ({ ratio, value, color, minValue, maxValue, avgValue }) => {
  const barWidth = 120;
  const range = maxValue - minValue;
  const centerPoint = barWidth / 2;
  
  // 값들의 위치를 계산 (중앙 기준)
  const valueScale = barWidth / range;
  const currentPos = centerPoint + (value - avgValue) * valueScale;

  return (
    <div style={{ position: 'relative', marginTop: '30px', marginBottom: '20px' }}>
      <BarWrapper>
        {/* 배경 구분선 (중앙) */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          width: '2px',
          height: '100%',
          background: '#ddd',
          transform: 'translateX(-50%)',
          zIndex: 1
        }} />

        {/* 현재값 막대 */}
        <BarFill
          style={{
            left: value > avgValue ? '50%' : `${currentPos}px`,
            width: `${Math.abs(value - avgValue) * valueScale}px`,
            background: color,
            zIndex: 2
          }}
        />

        {/* 최소값 표시 */}
        <MinMaxLine style={{ left: 0 }} />
        <ValueLabel 
          style={{ 
            left: '-10px', 
            transform: 'translateX(-100%)',
            textAlign: 'right'
          }}
        >
          {minValue.toFixed(2)}
        </ValueLabel>

        {/* 최대값 표시 */}
        <MinMaxLine style={{ right: 0 }} />
        <ValueLabel 
          style={{ 
            right: '-10px', 
            transform: 'translateX(100%)',
            textAlign: 'left'
          }}
        >
          {maxValue.toFixed(2)}
        </ValueLabel>

        {/* 평균값 표시 */}
        <ValueLabel 
          style={{ 
            left: '50%', 
            color: '#333', 
            fontWeight: 'bold',
            transform: 'translateX(-50%)',
            textAlign: 'center'
          }}
        >
          {avgValue.toFixed(2)}
        </ValueLabel>

        {/* 현재값 표시 */}
        <ValueLabel 
          style={{ 
            left: `${currentPos}px`,
            color,
            fontWeight: 'bold',
            top: '-40px',
            transform: 'translateX(-50%)',
            textAlign: 'center'
          }}
        >
          {value.toFixed(2)}
        </ValueLabel>
      </BarWrapper>
    </div>
  );
};

const ParameterBar = styled.div`
  position: relative;
  width: 100%;
  height: 8px;
  background: #f5f5f5;
  margin: 10px 0;
`;

const ValueIndicator = styled.div`
  position: absolute;
  width: 3px;
  height: 16px;
  background: #1890ff;
  top: -4px;
  transform: translateX(-50%);
`;

const RangeText = styled.span`
  position: absolute;
  font-size: 12px;
  color: #666;
  top: 12px;
`;

const AverageText = styled(RangeText)`
  left: 50%;
  transform: translateX(-50%);
  color: #999;
`;

const PulseVisualization = ({ pulseData = {
  PVC: 28.64,
  BV: 9.81,
  SV: 8.55,
  HR: 82.00,
  'a-b': null,
  'a-c': null,
  'a-d': null,
  'a-e': null,
  'b/a': null,
  'c/a': null,
  'd/a': null,
  'e/a': null
} }) => {
  const [averages, setAverages] = useState({
    PVC: '0.00',
    BV: '0.00',
    SV: '0.00',
    HR: '0.00',
    totalRecords: 0
  });

  useEffect(() => {
    const fetchAverages = async () => {
      try {
        const response = await pulseApi.getPulseParameterAverages();
        if (response && response.success) {
          setAverages(response.data);
        }
      } catch (error) {
        console.error('평균값 조회 실패:', error);
        setAverages({
          PVC: '0.00',
          BV: '0.00',
          SV: '0.00',
          HR: '0.00',
          totalRecords: 0
        });
      }
    };

    fetchAverages();
  }, []);

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
      .filter(type => type && !type.includes('평맥'))
      .sort(); // 일관된 순서를 위해 정렬

    if (significantRaw.length === 0) return '평맥';

    // 부삽허맥 조합 확인
    if (significantRaw.includes('부맥') && 
        significantRaw.includes('삽맥') && 
        significantRaw.includes('허맥')) {
      return '부삽허맥';
    }

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
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {[
              { name: 'PVC', label: '말초혈관수축도', value: PVC },
              { name: 'BV', label: '혈관점탄도', value: BV },
              { name: 'SV', label: '일회박출량', value: SV },
              { name: 'HR', label: '심박동수', value: HR }
            ].map((param) => {
              const range = PARAMETER_RANGES[param.name];
              const position = ((param.value - range.min) / (range.max - range.min)) * 100;
              const avgValue = (range.max + range.min) / 2;
              
              return (
                <div key={param.name} style={{ marginBottom: 30 }}>
                  <ParameterName>
                    {param.label} <ValueText>{param.value.toFixed(2)}</ValueText>
                  </ParameterName>
                  <ParameterBar>
                    <CenterLine />
                    <ValueIndicator style={{ left: `${position}%` }} />
                    <RangeText style={{ left: 0 }}>{range.min}</RangeText>
                    <AverageText>{avgValue.toFixed(2)}</AverageText>
                    <RangeText style={{ right: 0 }}>{range.max}</RangeText>
                  </ParameterBar>
                  <div style={{ textAlign: 'center', marginTop: 24, fontSize: '12px' }}>
                    {param.name}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </Col>
      <Col span={24}>
        <ResultCard>
          <Title level={4}>팔요맥 분류</Title>
          <div style={{ maxWidth: 800, margin: '20px auto' }}>
            <ClassificationRow>
              <ParameterInfo>
                <ParameterName>말초혈관수축도</ParameterName>
                <ParameterValue>{PVC.toFixed(2)}</ParameterValue>
              </ParameterInfo>
              <BarContainer>
                <CenterLine />
                <ValueMarker 
                  style={{ 
                    left: `${((PVC - PARAMETER_RANGES.PVC.min) / (PARAMETER_RANGES.PVC.max - PARAMETER_RANGES.PVC.min)) * 100}%` 
                  }} 
                />
                <RangeValue style={{ left: 0 }}>{PARAMETER_RANGES.PVC.min.toFixed(2)}</RangeValue>
                <RangeValue style={{ left: '50%', transform: 'translateX(-50%)' }}>{PARAMETER_RANGES.PVC.mean.toFixed(2)}</RangeValue>
                <RangeValue style={{ right: 0 }}>{PARAMETER_RANGES.PVC.max.toFixed(2)}</RangeValue>
              </BarContainer>
              <Tag color={getTagColor(pulseTypes.PVC)}>{pulseTypes.PVC}</Tag>
            </ClassificationRow>

            <ClassificationRow>
              <ParameterInfo>
                <ParameterName>혈관점탄도</ParameterName>
                <ParameterValue>{BV.toFixed(2)}</ParameterValue>
              </ParameterInfo>
              <BarContainer>
                <CenterLine />
                <ValueMarker 
                  style={{ 
                    left: `${((BV - PARAMETER_RANGES.BV.min) / (PARAMETER_RANGES.BV.max - PARAMETER_RANGES.BV.min)) * 100}%` 
                  }} 
                />
                <RangeValue style={{ left: 0 }}>{PARAMETER_RANGES.BV.min.toFixed(2)}</RangeValue>
                <RangeValue style={{ left: '50%', transform: 'translateX(-50%)' }}>{PARAMETER_RANGES.BV.mean.toFixed(2)}</RangeValue>
                <RangeValue style={{ right: 0 }}>{PARAMETER_RANGES.BV.max.toFixed(2)}</RangeValue>
              </BarContainer>
              <Tag color={getTagColor(pulseTypes.BV)}>{pulseTypes.BV}</Tag>
            </ClassificationRow>

            <ClassificationRow>
              <ParameterInfo>
                <ParameterName>일회박출량</ParameterName>
                <ParameterValue>{SV.toFixed(2)}</ParameterValue>
              </ParameterInfo>
              <BarContainer>
                <CenterLine />
                <ValueMarker 
                  style={{ 
                    left: `${((SV - PARAMETER_RANGES.SV.min) / (PARAMETER_RANGES.SV.max - PARAMETER_RANGES.SV.min)) * 100}%` 
                  }} 
                />
                <RangeValue style={{ left: 0 }}>{PARAMETER_RANGES.SV.min.toFixed(2)}</RangeValue>
                <RangeValue style={{ left: '50%', transform: 'translateX(-50%)' }}>{PARAMETER_RANGES.SV.mean.toFixed(2)}</RangeValue>
                <RangeValue style={{ right: 0 }}>{PARAMETER_RANGES.SV.max.toFixed(2)}</RangeValue>
              </BarContainer>
              <Tag color={getTagColor(pulseTypes.SV)}>{pulseTypes.SV}</Tag>
            </ClassificationRow>

            <ClassificationRow>
              <ParameterInfo>
                <ParameterName>심박동수</ParameterName>
                <ParameterValue>{HR.toFixed(2)}</ParameterValue>
              </ParameterInfo>
              <BarContainer>
                <CenterLine />
                <ValueMarker 
                  style={{ 
                    left: `${((HR - PARAMETER_RANGES.HR.min) / (PARAMETER_RANGES.HR.max - PARAMETER_RANGES.HR.min)) * 100}%` 
                  }} 
                />
                <RangeValue style={{ left: 0 }}>{PARAMETER_RANGES.HR.min.toFixed(2)}</RangeValue>
                <RangeValue style={{ left: '50%', transform: 'translateX(-50%)' }}>{PARAMETER_RANGES.HR.mean.toFixed(2)}</RangeValue>
                <RangeValue style={{ right: 0 }}>{PARAMETER_RANGES.HR.max.toFixed(2)}</RangeValue>
              </BarContainer>
              <Tag color={getTagColor(pulseTypes.HR)}>{pulseTypes.HR}</Tag>
            </ClassificationRow>

            <Divider />
            
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Space>
                <Tag color="purple" style={{ fontSize: '16px', padding: '5px 10px' }}>
                  {combinedPulse}
                </Tag>
                {combinedPulse && combinedPulse !== '평맥' && (
                  <PulseInfoButton 
                    pulseType={combinedPulse}
                    patientPulseData={{
                      PVC, BV, SV, HR
                    }}
                  >
                    맥상정보 보기
                  </PulseInfoButton>
                )}
              </Space>
            </div>
          </div>
          <Text type="secondary" style={{ marginTop: '1rem', display: 'block' }}>
            * BV, SV, HR의 분류 기준(상한/하한)은 현재 예시값이며, 향후 축적된 데이터에 따라 동적으로 조정될 예정입니다.
          </Text>
        </ResultCard>
      </Col>
    </Row>
  );
};

export default PulseVisualization;

