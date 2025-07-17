import React, { useState, useEffect } from 'react';
import { Card, Typography, Tag, Row, Col, Descriptions, Space, Button, Divider, Input, Select, message } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine, ReferenceArea, LineChart, Line, Legend } from 'recharts';
import styled from 'styled-components';
import PulseInfoButton from '../PulseInfoButton';
import * as pulseApi from '../../api/pulseApi';
import dayjs from 'dayjs';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Search } = Input;

const ResultCard = styled(Card)`
  .ant-card-head {
    background-color: #fafafa;
    border-bottom: 1px solid #f0f0f0;
  }

  .ant-card-head-title {
    font-size: 16px;
    font-weight: 600;
  }

  .ant-tag {
    margin-left: 16px;
    padding: 4px 8px;
    font-size: 14px;
    border-radius: 4px;
    
    &:hover {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }
`;

const ClassificationRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
`;

const ParameterInfo = styled.div`
  width: 200px;
  display: flex;
  flex-direction: column;
  padding-right: 16px;
`;

const ParameterName = styled.div`
  font-size: 14px;
  color: #262626;
  margin-bottom: 4px;
`;

const ParameterValue = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
`;

const BarContainer = styled.div`
  flex: 1;
  height: 12px;
  background: #f0f2f5;
  position: relative;
  margin: 0 20px;
  border-radius: 6px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const CenterLine = styled.div`
  position: absolute;
  left: 50%;
  height: 100%;
  width: 2px;
  background: rgba(24, 144, 255, 0.2);
  transform: translateX(-50%);
  border-left: 2px dashed rgba(24, 144, 255, 0.4);
`;

const AverageLine = styled.div`
  position: absolute;
  left: 50%;
  width: 2px;
  height: 24px;
  background: #1890ff;
  transform: translateX(-50%);
  top: -6px;
  z-index: 2;

  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 8px;
    height: 8px;
    background: #1890ff;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(24, 144, 255, 0.3);
  }

  &::after {
    content: attr(data-value);
    position: absolute;
    bottom: -24px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 13px;
    color: #1890ff;
    font-weight: bold;
    white-space: nowrap;
    background: rgba(24, 144, 255, 0.1);
    padding: 2px 8px;
    border-radius: 4px;
  }
`;

const ValueMarker = styled.div`
  position: absolute;
  width: 4px;
  height: 24px;
  background: #1890ff;
  top: -6px;
  transform: translateX(-50%);
  border-radius: 2px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;

  &:hover {
    height: 28px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid currentColor;
  }
`;

const RangeValue = styled.div`
  position: absolute;
  font-size: 12px;
  color: #8c8c8c;
  top: -28px;
  transform: translateX(-50%);
  font-weight: 500;
  white-space: nowrap;
`;

const ValueText = styled.span`
  color: #1890ff;
  font-weight: bold;
  font-size: 16px;
  margin-left: 12px;
  background: rgba(24, 144, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
`;

const PULSE_THRESHOLDS = {
  PVC: { LOW: 60, HIGH: 90 },
  BV: { LOW: 7, HIGH: 10 },
  SV: { LOW: 55, HIGH: 70 },
  HR: { LOW: 65, HIGH: 85 },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        backgroundColor: 'white', 
        padding: '12px',
        border: '1px solid #f0f0f0',
        borderRadius: '4px'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{dayjs(label).format('YYYY-MM-DD HH:mm')}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: 0, color: entry.color }}>
            {entry.name}: {Number(entry.value || 0).toFixed(2)}
          </p>
        ))}
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

  if (v < low + threshold) return labels[0];      // 활맥/허맥/부맥/지맥
  if (v > high - threshold) return labels[2];     // 삽맥/실맥/침맥/삭맥
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
  height: 12px;
  background: #f0f2f5;
  border-radius: 6px;
  margin: 16px 0;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    left: 50%;
    width: 30%;
    height: 100%;
    background: rgba(24, 144, 255, 0.1);
    transform: translateX(-50%);
    border-radius: 6px;
  }
`;

const ValueIndicator = styled.div`
  position: absolute;
  width: 4px;
  height: 24px;
  background: #1890ff;
  top: -6px;
  transform: translateX(-50%);
  border-radius: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 3;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #1890ff;
  }
`;

const RangeText = styled.span`
  position: absolute;
  font-size: 12px;
  color: #8c8c8c;
  top: 20px;
  transform: translateX(-50%);
  font-weight: 500;
`;

const AverageText = styled(RangeText)`
  color: #1890ff;
  font-weight: bold;
`;

const PulseValueCard = styled(Card)`
  .ant-card-body {
    padding: 24px;
    position: relative;
    transition: all 0.3s ease;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .value-header {
    border-bottom: 2px solid #1890ff;
    padding-bottom: 8px;
    margin-bottom: 16px;
  }

  .main-value {
    font-size: 36px;
    font-weight: bold;
    text-align: center;
    margin: 24px 0;
  }

  .range-info {
    display: flex;
    justify-content: space-between;
    background: #fafafa;
    padding: 12px 16px;
    border-radius: 8px;
    margin-top: 24px;
    border: 1px solid #f0f0f0;
  }

  .alert-tag {
    position: absolute;
    top: -12px;
    right: -12px;
  }

  .progress-container {
    margin: 40px 0;
    padding: 0 20px;
    position: relative;
  }

  .progress-bar {
    height: 24px;
    background: #f0f2f5;
    border-radius: 12px;
    position: relative;
    overflow: visible;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .normal-range {
    position: absolute;
    height: 100%;
    background: rgba(24, 144, 255, 0.15);
    border-left: 2px dashed rgba(24, 144, 255, 0.4);
    border-right: 2px dashed rgba(24, 144, 255, 0.4);
    border-radius: 12px;
  }

  .value-marker {
    position: absolute;
    width: 4px;
    height: 32px;
    top: -4px;
    border-radius: 2px;
    transform: translateX(-50%);
    z-index: 2;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;

    &:hover {
      height: 36px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    &::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid currentColor;
    }
  }

  .marker-label {
    position: absolute;
    top: -28px;
    transform: translateX(-50%);
    font-size: 13px;
    font-weight: bold;
    white-space: nowrap;
    background: currentColor;
    color: white !important;
    padding: 2px 8px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .range-marker {
    position: absolute;
    width: 2px;
    height: 16px;
    background: #bfbfbf;
    top: 4px;

    &::after {
      content: attr(data-value);
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
      color: #8c8c8c;
      white-space: nowrap;
      font-weight: 500;
    }
  }
`;

const PulseValueDisplay = ({ label, value, min, max, avg, isAlert }) => {
  // 진행률 바의 위치 계산
  const range = max - min;
  const position = ((value - min) / range) * 100;
  const normalRangeStart = ((avg - (range * 0.15) - min) / range) * 100;
  const normalRangeEnd = ((avg + (range * 0.15) - min) / range) * 100;

  // 값의 상태에 따른 색상 설정
  const getValueColor = () => {
    if (isAlert) return '#ff4d4f';
    if (value > avg + (range * 0.15)) return '#faad14';
    if (value < avg - (range * 0.15)) return '#faad14';
    return '#52c41a';
  };

  const valueColor = getValueColor();

  return (
    <PulseValueCard>
      <div className="value-header">
        <Title level={4} style={{ margin: 0 }}>{label}</Title>
      </div>
      
      <div className="main-value" style={{ color: valueColor }}>
        {value?.toFixed(2)}
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          {/* 정상 범위 표시 */}
          <div 
            className="normal-range"
            style={{
              left: `${normalRangeStart}%`,
              width: `${normalRangeEnd - normalRangeStart}%`
            }}
          />

          {/* 범위 마커들 */}
          <div className="range-markers">
            <div className="range-marker" style={{ left: '0%' }} data-value={min.toFixed(1)} />
            <div className="range-marker" style={{ left: '50%' }} data-value={avg.toFixed(1)} />
            <div className="range-marker" style={{ right: '0%' }} data-value={max.toFixed(1)} />
          </div>

          {/* 현재값 마커 */}
          <div 
            className="value-marker"
            style={{ 
              left: `${position}%`,
              background: valueColor,
              color: valueColor
            }}
          >
            <span className="marker-label">
              {value.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="range-info">
        <Text type="secondary">최소: {min}</Text>
        <Text type="secondary">평균: {avg}</Text>
        <Text type="secondary">최대: {max}</Text>
      </div>

      {isAlert && (
        <Tag color="error" className="alert-tag">
          주의 필요
        </Tag>
      )}
    </PulseValueCard>
  );
};

const HistoryChart = styled(Card)`
  margin-top: 16px;
  .ant-card-head {
    background-color: #fafafa;
    border-bottom: 1px solid #f0f0f0;
  }
  .recharts-default-tooltip {
    background-color: rgba(255, 255, 255, 0.95) !important;
    border: none !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
    border-radius: 4px !important;
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
`;

const PatientInfo = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
`;

const PulseVisualization = ({ 
  pulseData = {}, 
  historyData = [], 
  onHistoryUpdate = () => {}
}) => {
  const [averages, setAverages] = useState({
    PVC: '0.00',
    BV: '0.00',
    SV: '0.00',
    HR: '0.00',
    totalRecords: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // 값의 상태에 따른 색상 설정 함수 추가
  const getValueColor = (value, mean, range) => {
    const threshold = range * 0.15;
    if (value > mean + threshold) return '#faad14';
    if (value < mean - threshold) return '#faad14';
    return '#52c41a';
  };

  // 환자 검색 함수
  const handleSearch = async (value) => {
    if (!value.trim()) {
      message.warning('검색어를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`/api/patients/search?query=${value}`);
      if (response.data.success) {
        setPatients(response.data.data);
        if (response.data.data.length === 0) {
          message.info('검색 결과가 없습니다.');
        }
      }
    } catch (error) {
      console.error('환자 검색 실패:', error);
      message.error('환자 검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 환자 선택 시 맥진 기록 조회
  const handlePatientSelect = async (patientId) => {
    try {
      setLoading(true);
      const selectedPatient = patients.find(p => p._id === patientId);
      setSelectedPatient(selectedPatient);

      const response = await axios.get(`/api/patients/${patientId}/pulse-history`);
      if (response.data.success) {
        // 상위 컴포넌트의 상태 업데이트 함수가 있다면 호출
        onHistoryUpdate(response.data.data);
      }
    } catch (error) {
      console.error('맥진 기록 조회 실패:', error);
      message.error('맥진 기록 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryCharts = () => {
    if (!historyData || historyData.length === 0) return null;

    const parameters = [
      { key: 'PVC', name: '말초혈관수축도', color: '#1890ff' },
      { key: 'BV', name: '혈관점탄도', color: '#52c41a' },
      { key: 'SV', name: '일회박출량', color: '#722ed1' },
      { key: 'HR', name: '심박동수', color: '#fa8c16' }
    ];

    return (
      <Col span={24}>
        <HistoryChart title="측정 이력 비교">
          <div style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={historyData.map(record => ({
                  timestamp: record.timestamp,
                  PVC: record.PVC,
                  BV: record.BV,
                  SV: record.SV,
                  HR: record.HR
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => dayjs(value).format('MM-DD')}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {parameters.map(param => (
                  <Line
                    key={param.key}
                    type="monotone"
                    dataKey={param.key}
                    name={param.name}
                    stroke={param.color}
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'white', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
                {parameters.map(param => {
                  const range = PARAMETER_RANGES[param.key];
                  return (
                    <React.Fragment key={param.key}>
                      <ReferenceLine
                        y={range.mean}
                        stroke={param.color}
                        strokeDasharray="3 3"
                        strokeOpacity={0.5}
                      />
                      <ReferenceArea
                        y1={range.mean - (range.max - range.min) * 0.15}
                        y2={range.mean + (range.max - range.min) * 0.15}
                        fill={param.color}
                        fillOpacity={0.05}
                      />
                    </React.Fragment>
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </HistoryChart>
      </Col>
    );
  };

  // 데이터 유효성 검사 및 기본값 설정
  const safeNumber = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const normalizedPulseData = {
    systolicBP: safeNumber(pulseData.systolicBP),
    diastolicBP: safeNumber(pulseData.diastolicBP),
    heartRate: safeNumber(pulseData.heartRate),
    pulsePressure: safeNumber(pulseData.pulsePressure),
    'a-b': safeNumber(pulseData['a-b']),
    'a-c': safeNumber(pulseData['a-c']),
    'a-d': safeNumber(pulseData['a-d']),
    'a-e': safeNumber(pulseData['a-e']),
    'b/a': safeNumber(pulseData['b/a']),
    'c/a': safeNumber(pulseData['c/a']),
    'd/a': safeNumber(pulseData['d/a']),
    'e/a': safeNumber(pulseData['e/a']),
    elasticityScore: safeNumber(pulseData.elasticityScore),
    PVC: safeNumber(pulseData.PVC),
    BV: safeNumber(pulseData.BV),
    SV: safeNumber(pulseData.SV),
    HR: safeNumber(pulseData.HR || pulseData.heartRate)
  };

  return (
    <div>
      <SearchContainer>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Search
            placeholder="환자 이름 또는 ID를 입력하세요"
            enterButton={<SearchOutlined />}
            size="large"
            loading={loading}
            onSearch={handleSearch}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {patients.length > 0 && (
            <Select
              style={{ width: '100%' }}
              placeholder="환자를 선택하세요"
              onChange={handlePatientSelect}
              loading={loading}
              options={patients.map(patient => ({
                value: patient._id,
                label: `${patient.name} (${patient.patientId})`
              }))}
            />
          )}
        </Space>
      </SearchContainer>

      {selectedPatient && (
        <PatientInfo>
          <Title level={4}>{selectedPatient.name}님의 맥진 기록</Title>
        </PatientInfo>
      )}

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
                const safeValue = Number(param.value) || 0;
                const position = ((safeValue - range.min) / (range.max - range.min)) * 100;
                const avgValue = range.mean;
                
                return (
                  <div key={param.name} style={{ marginBottom: 30 }}>
                    <ParameterName>
                      {param.label} <ValueText>{(Number(param.value) || 0).toFixed(2)}</ValueText>
                    </ParameterName>
                    <ParameterBar>
                      <CenterLine />
                      <AverageLine data-value={avgValue.toFixed(2)} />
                      <ValueIndicator 
                        style={{ 
                          left: `${position}%`,
                          background: getValueColor(safeValue, avgValue, range.max - range.min)
                        }} 
                      />
                      <RangeText style={{ left: 0 }}>{range.min.toFixed(2)}</RangeText>
                      <RangeText style={{ right: 0 }}>{range.max.toFixed(2)}</RangeText>
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
                  <ParameterValue>{(Number(PVC) || 0).toFixed(2)}</ParameterValue>
                </ParameterInfo>
                <BarContainer>
                  <CenterLine />
                  <ValueMarker 
                    style={{ 
                      left: `${(((Number(PVC) || 0) - PARAMETER_RANGES.PVC.min) / (PARAMETER_RANGES.PVC.max - PARAMETER_RANGES.PVC.min)) * 100}%`,
                      background: getValueColor(Number(PVC) || 0, PARAMETER_RANGES.PVC.mean, PARAMETER_RANGES.PVC.max - PARAMETER_RANGES.PVC.min),
                      color: getValueColor(Number(PVC) || 0, PARAMETER_RANGES.PVC.mean, PARAMETER_RANGES.PVC.max - PARAMETER_RANGES.PVC.min)
                    }} 
                  />
                  <RangeValue style={{ left:0}}>{PARAMETER_RANGES.PVC.min.toFixed(2)}</RangeValue>
                  <RangeValue style={{ left: '50%' }}>{PARAMETER_RANGES.PVC.mean.toFixed(2)}</RangeValue>
                  <RangeValue style={{ right: 0 }}>{PARAMETER_RANGES.PVC.max.toFixed(2)}</RangeValue>
                </BarContainer>
                <Tag color={getTagColor(pulseTypes.PVC)} style={{ minWidth: 60, textAlign: 'center' }}>{pulseTypes.PVC}</Tag>
              </ClassificationRow>

              <ClassificationRow>
                <ParameterInfo>
                  <ParameterName>혈관점탄도</ParameterName>
                  <ParameterValue>{(Number(BV) || 0).toFixed(2)}</ParameterValue>
                </ParameterInfo>
                <BarContainer>
                  <CenterLine />
                  <ValueMarker 
                    style={{ 
                      left: `${(((Number(BV) || 0) - PARAMETER_RANGES.BV.min) / (PARAMETER_RANGES.BV.max - PARAMETER_RANGES.BV.min)) * 100}%`,
                      background: getValueColor(Number(BV) || 0, PARAMETER_RANGES.BV.mean, PARAMETER_RANGES.BV.max - PARAMETER_RANGES.BV.min),
                      color: getValueColor(Number(BV) || 0, PARAMETER_RANGES.BV.mean, PARAMETER_RANGES.BV.max - PARAMETER_RANGES.BV.min)
                    }} 
                  />
                  <RangeValue style={{ left:0}}>{PARAMETER_RANGES.BV.min.toFixed(2)}</RangeValue>
                  <RangeValue style={{ left: '50%' }}>{PARAMETER_RANGES.BV.mean.toFixed(2)}</RangeValue>
                  <RangeValue style={{ right: 0 }}>{PARAMETER_RANGES.BV.max.toFixed(2)}</RangeValue>
                </BarContainer>
                <Tag color={getTagColor(pulseTypes.BV)} style={{ minWidth: 60, textAlign: 'center' }}>{pulseTypes.BV}</Tag>
              </ClassificationRow>

              <ClassificationRow>
                <ParameterInfo>
                  <ParameterName>일회박출량</ParameterName>
                  <ParameterValue>{(Number(SV) || 0).toFixed(2)}</ParameterValue>
                </ParameterInfo>
                <BarContainer>
                  <CenterLine />
                  <ValueMarker 
                    style={{ 
                      left: `${(((Number(SV) || 0) - PARAMETER_RANGES.SV.min) / (PARAMETER_RANGES.SV.max - PARAMETER_RANGES.SV.min)) * 100}%`,
                      background: getValueColor(Number(SV) || 0, PARAMETER_RANGES.SV.mean, PARAMETER_RANGES.SV.max - PARAMETER_RANGES.SV.min),
                      color: getValueColor(Number(SV) || 0, PARAMETER_RANGES.SV.mean, PARAMETER_RANGES.SV.max - PARAMETER_RANGES.SV.min)
                    }} 
                  />
                  <RangeValue style={{ left:0}}>{PARAMETER_RANGES.SV.min.toFixed(2)}</RangeValue>
                  <RangeValue style={{ left: '50%' }}>{PARAMETER_RANGES.SV.mean.toFixed(2)}</RangeValue>
                  <RangeValue style={{ right: 0 }}>{PARAMETER_RANGES.SV.max.toFixed(2)}</RangeValue>
                </BarContainer>
                <Tag color={getTagColor(pulseTypes.SV)} style={{ minWidth: 60, textAlign: 'center' }}>{pulseTypes.SV}</Tag>
              </ClassificationRow>

              <ClassificationRow>
                <ParameterInfo>
                  <ParameterName>심박동수</ParameterName>
                  <ParameterValue>{(Number(HR) || 0).toFixed(2)}</ParameterValue>
                </ParameterInfo>
                <BarContainer>
                  <CenterLine />
                  <ValueMarker 
                    style={{ 
                      left: `${(((Number(HR) || 0) - PARAMETER_RANGES.HR.min) / (PARAMETER_RANGES.HR.max - PARAMETER_RANGES.HR.min)) * 100}%`,
                      background: getValueColor(Number(HR) || 0, PARAMETER_RANGES.HR.mean, PARAMETER_RANGES.HR.max - PARAMETER_RANGES.HR.min),
                      color: getValueColor(Number(HR) || 0, PARAMETER_RANGES.HR.mean, PARAMETER_RANGES.HR.max - PARAMETER_RANGES.HR.min)
                    }} 
                  />
                  <RangeValue style={{ left:0}}>{PARAMETER_RANGES.HR.min.toFixed(2)}</RangeValue>
                  <RangeValue style={{ left: '50%' }}>{PARAMETER_RANGES.HR.mean.toFixed(2)}</RangeValue>
                  <RangeValue style={{ right: 0 }}>{PARAMETER_RANGES.HR.max.toFixed(2)}</RangeValue>
                </BarContainer>
                <Tag color={getTagColor(pulseTypes.HR)} style={{ minWidth: 60, textAlign: 'center' }}>{pulseTypes.HR}</Tag>
              </ClassificationRow>

              <Divider />
              
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Space size="large">
                  <Tag color="purple" style={{ fontSize: '16px', padding: '8px 16px' }}>
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
        {renderHistoryCharts()}
      </Row>
    </div>
  );
};

export default PulseVisualization;

