import React, { useState, useEffect, useRef } from 'react';
import { Spin, Alert, Descriptions, Tag, Row, Col, Typography, Card, Modal, Button, Progress } from 'antd';
import { FileTextOutlined, MedicineBoxOutlined, BulbOutlined, LineChartOutlined, HeartOutlined, ShareAltOutlined, PrinterOutlined, FilePdfOutlined } from '@ant-design/icons';
import * as pulseApi from '../api/pulseApi';
import html2pdf from 'html2pdf.js';
import { useReactToPrint } from 'react-to-print';
import styled, { createGlobalStyle } from 'styled-components';

const { Title, Text, Paragraph } = Typography;

// 전역 스타일 추가
const GlobalStyle = createGlobalStyle`
  .pulse-modal-scrollable {
    overflow-y: scroll !important;
    overflow-x: hidden !important;
    scrollbar-width: thin !important;
    scrollbar-color: #888 #f1f1f1 !important;
    
    &::-webkit-scrollbar {
      width: 12px !important;
      background-color: #f1f1f1 !important;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f1f1 !important;
      border-radius: 6px !important;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #888 !important;
      border-radius: 6px !important;
      
      &:hover {
        background: #555 !important;
      }
    }
  }
`;

// 장부별 이모티콘+한글(영문) 매핑
const ORGAN_LABELS = {
  cardiovascular: { emoji: '❤️', label: '심혈관(Cardiovascular)' },
  respiratory: { emoji: '🫁', label: '호흡기(Respiratory)' },
  renal: { emoji: '🩸', label: '신장(Renal)' },
  musculoskeletal: { emoji: '💪', label: '근골격(Musculoskeletal)' },
  dermatologic: { emoji: '🧑‍🦲', label: '피부(Dermatologic)' },
  gastrointestinal: { emoji: '🍽️', label: '소화기(Gastrointestinal)' },
  neurological: { emoji: '🧠', label: '신경계(Neurological)' },
  endocrine: { emoji: '🦋', label: '내분비(Endocrine)' },
  ophthalmologic: { emoji: '👁️', label: '안과(Ophthalmologic)' },
  reproductive: { emoji: '⚧️', label: '생식기(Reproductive)' },
  hematologic: { emoji: '🩸', label: '혈액(Hematologic)' },
  immune: { emoji: '🛡️', label: '면역계(Immune)' },
  ent: { emoji: '👂', label: '이비인후과(ENT)' },
  // 기타 추가 가능
};

const StyledModal = styled(Modal)`
  && {
    .ant-modal {
      width: 90vw !important;
      max-width: 1200px !important;
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      margin: 0 !important;
      height: 70vh !important;
      min-height: 60vh !important;
      max-height: 70vh !important;
      padding: 0 !important;
      z-index: 9999 !important;
    }

    .ant-modal-mask {
      z-index: 9998 !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
    }

    .ant-modal-wrap {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 9999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 20px !important;
    }

    .ant-modal-content {
      border-radius: 16px !important;
      overflow: hidden !important;
      height: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      position: relative !important;
      margin: 0 !important;
      width: 100% !important;
    }
    
    .ant-modal-header {
      background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
      padding: 12px 24px !important;
      border-bottom: none;
      flex-shrink: 0 !important;
      position: sticky !important;
      top: 0 !important;
      z-index: 10 !important;
      
      .ant-modal-title {
        color: white;
        font-size: 18px !important;
        font-weight: 600;
      }
    }

    .ant-modal-close {
      color: white;
    }

    .ant-modal-body {
      flex: 1 !important;
      overflow: hidden !important;
      padding: 0 !important;
      height: calc(70vh - 100px) !important;
      max-height: calc(70vh - 100px) !important;
    }

    .ant-modal-footer {
      flex-shrink: 0 !important;
      padding: 12px 24px !important;
      border-top: 1px solid #f0f0f0;
      position: sticky !important;
      bottom: 0 !important;
      background: white !important;
      z-index: 10 !important;
    }

    /* 반응형 디자인 개선 */
    @media (max-width: 1200px) {
      .ant-modal {
        width: 95vw !important;
        max-width: 95vw !important;
      }
    }

    @media (max-width: 768px) {
      .ant-modal {
        width: 100vw !important;
        max-width: 100vw !important;
        top: 0 !important;
        left: 0 !important;
        transform: none !important;
        height: 100vh !important;
        min-height: 100vh !important;
        max-height: 100vh !important;
      }
      
      .ant-modal-wrap {
        padding: 0 !important;
        align-items: flex-start !important;
        justify-content: flex-start !important;
      }
      
      .ant-modal-content {
        height: 100vh !important;
        border-radius: 0 !important;
        width: 100% !important;
        min-height: 100vh !important;
        max-height: 100vh !important;
      }
      
      .ant-modal-body {
        height: calc(100vh - 100px) !important;
        overflow: hidden !important;
        padding: 0 !important;
      }
      
      .pulse-modal-scrollable {
        height: calc(100vh - 120px) !important;
        max-height: calc(100vh - 120px) !important;
      }
    }

    @media (max-width: 480px) {
      .ant-modal-header {
        padding: 10px 16px !important;
        
        .ant-modal-title {
          font-size: 16px !important;
        }
      }
    }
  }
`;

const ScrollableContent = styled.div`
  height: calc(70vh - 120px) !important;
  max-height: calc(70vh - 120px) !important;
  overflow-y: scroll !important;
  overflow-x: hidden !important;
  padding: 16px;
  
  /* 스크롤바 강제 표시 */
  scrollbar-width: thin !important;
  scrollbar-color: #888 #f1f1f1 !important;
  
  /* WebKit 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    width: 12px !important;
    background-color: #f1f1f1 !important;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1 !important;
    border-radius: 6px !important;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888 !important;
    border-radius: 6px !important;
    
    &:hover {
      background: #555 !important;
    }
  }
  
  /* 스크롤 강제 활성화 */
  overflow: scroll !important;
  
  /* 내용이 넘칠 때 스크롤 강제 */
  white-space: normal !important;
  word-wrap: break-word !important;
`;

const GradientCard = styled(Card)`
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .ant-card-head {
    background: ${props => props.gradient || 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)'} !important;
    border-bottom: none !important;
    padding: 12px 20px !important;
    
    .ant-card-head-title {
      color: white !important;
      font-size: 16px !important;
      font-weight: 600 !important;
      
      .anticon {
        margin-right: 8px;
      }
    }
  }

  .ant-card-body {
    padding: 20px;
    background: white;
  }

  /* 반응형 디자인 */
  @media (max-width: 768px) {
    .ant-card-head {
      padding: 10px 16px !important;
      
      .ant-card-head-title {
        font-size: 14px !important;
      }
    }
    
    .ant-card-body {
      padding: 16px;
    }
  }
`;

const StyledTag = styled(Tag)`
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 500;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const AnimatedBar = styled.div`
  position: relative;
  height: 24px;
  background: #f0f2f5;
  border-radius: 12px;
  overflow: hidden;
  margin: 8px 0;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: ${props => props.value}%;
    height: 100%;
    background: ${props => props.color};
    border-radius: 12px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

const SectionCard = ({ title, icon, children, gradient }) => (
  <GradientCard
    title={<span>{icon} {title}</span>}
    gradient={gradient}
  >
    {children}
  </GradientCard>
);

const ParameterBar = styled.div`
  position: relative;
  width: 100%;
  height: 24px;
  background: #f0f2f5;
  border-radius: 12px;
  margin: 16px 0;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8e8e8;
  overflow: visible;
  
  &::before {
    content: '';
    position: absolute;
    left: 50%;
    width: 30%;
    height: 100%;
    background: rgba(24, 144, 255, 0.1);
    transform: translateX(-50%);
    border-radius: 12px;
  }
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

const ValueMarker = styled.div`
  position: absolute;
  width: 8px;
  height: 32px;
  background: #1890ff;
  top: -4px;
  transform: translateX(-50%);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 3;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid currentColor;
  }
`;

const RangeValue = styled.div`
  position: absolute;
  font-size: 12px;
  color: #8c8c8c;
  top: 30px;
  transform: translateX(-50%);
  font-weight: 500;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 4px;
  border-radius: 3px;
  white-space: nowrap;
`;

const AverageLine = styled.div`
  position: absolute;
  left: 50%;
  width: 4px;
  height: 32px;
  background: #1890ff;
  transform: translateX(-50%);
  top: -4px;
  z-index: 2;

  &::before {
    content: '';
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 16px;
    background: #1890ff;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.4);
  }

  &::after {
    content: attr(data-value);
    position: absolute;
    bottom: -35px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    color: #1890ff;
    font-weight: bold;
    white-space: nowrap;
    background: rgba(24, 144, 255, 0.1);
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid rgba(24, 144, 255, 0.2);
  }
`;

const ClassificationRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
  gap: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const ParameterInfo = styled.div`
  width: 200px;
  display: flex;
  flex-direction: column;
  padding-right: 16px;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 100%;
    padding-right: 0;
  }
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

const PulseInfoModal = ({ isOpen, onClose, pulseType, patientPulseData }) => {
  const [pulseData, setPulseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    const fetchPulseInfo = async () => {
      if (!pulseType) return;
      setLoading(true);
      setError(null);
      try {
        const response = await pulseApi.getPulseProfileByName(pulseType);
        if (response.data.success) {
          setPulseData(response.data.data);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        console.error('맥상 정보 조회 오류:', err);
        setError('맥상 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchPulseInfo();
    }
  }, [isOpen, pulseType]);

  // 실제 환자 측정 데이터를 사용하거나, 없으면 기본값 사용
  const getPulseValues = () => {
    // 실제 환자 데이터가 있으면 사용
    if (patientPulseData) {
      return {
        PVC: patientPulseData.PVC || 28.64,
        BV: patientPulseData.BV || 9.81,
        SV: patientPulseData.SV || 8.55,
        HR: patientPulseData.HR || 82.00
      };
    }

    // 환자 데이터가 없으면 맥상 타입에 따라 예시값 설정
    const baseValues = {
      PVC: 28.64,
      BV: 9.81,
      SV: 8.55,
      HR: 82.00
    };

    // 맥상 타입에 따라 값 조정
    if (pulseType?.includes('부')) {
      baseValues.PVC = 22.00; // 부맥: 낮은 값
    }
    if (pulseType?.includes('침')) {
      baseValues.PVC = 36.00; // 침맥: 높은 값
    }
    if (pulseType?.includes('활')) {
      baseValues.BV = 8.20; // 활맥: 낮은 값
    }
    if (pulseType?.includes('삽')) {
      baseValues.BV = 9.81; // 삽맥: 높은 값
    }
    if (pulseType?.includes('허')) {
      baseValues.SV = 7.00; // 허맥: 낮은 값
    }
    if (pulseType?.includes('실')) {
      baseValues.SV = 10.50; // 실맥: 높은 값
    }
    if (pulseType?.includes('지')) {
      baseValues.HR = 55.00; // 지맥: 낮은 값
    }
    if (pulseType?.includes('삭')) {
      baseValues.HR = 100.00; // 삭맥: 높은 값
    }

    return baseValues;
  };

  const pulseValues = getPulseValues();
  
  const normalRanges = {
    PVC: { min: 20.98, max: 38.07, avg: 29.53 },
    BV: { min: 8.07, max: 10.27, avg: 9.17 },
    SV: { min: 6.45, max: 11.41, avg: 8.93 },
    HR: { min: 50.00, max: 107.00, avg: 78.50 }
  };

  const getBarValue = (key, value) => {
    const { min, max } = normalRanges[key];
    if (value === undefined) return 0;
    const avg = (min + max) / 2;
    const maxDist = max - avg;
    const minDist = avg - min;
    
    if (value >= avg && maxDist !== 0) {
      return (value - avg) / maxDist;
    } else if (value < avg && minDist !== 0) {
      return -((avg - value) / minDist);
    }
    return 0;
  };

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

  const PulseBar = ({ ratio, value, color, min, max, avg }) => {
    const position = ((value - min) / (max - min)) * 100;
    
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        height: '40px',
        background: '#f0f2f5',
        borderRadius: '20px',
        margin: '16px 0',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e8e8e8',
        overflow: 'visible'
      }}>
        {/* 중앙 평균선 */}
        <div style={{
          position: 'absolute',
          left: '50%',
          height: '100%',
          width: '2px',
          background: 'rgba(24, 144, 255, 0.3)',
          transform: 'translateX(-50%)',
          zIndex: 1
        }} />
        
        {/* 평균값 표시 */}
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: '-25px',
          transform: 'translateX(-50%)',
          fontSize: '12px',
          color: '#1890ff',
          fontWeight: 'bold',
          background: 'rgba(24, 144, 255, 0.1)',
          padding: '2px 6px',
          borderRadius: '4px',
          border: '1px solid rgba(24, 144, 255, 0.2)',
          whiteSpace: 'nowrap'
        }}>
          {avg.toFixed(2)}
        </div>
        
        {/* 현재 값 마커 */}
        <div style={{
          position: 'absolute',
          width: '8px',
          height: '36px',
          background: color,
          top: '-2px',
          left: `${position}%`,
          transform: 'translateX(-50%)',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          zIndex: 3
        }}>
          {/* 삼각형 화살표 */}
          <div style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `8px solid ${color}`
          }} />
        </div>
        
        {/* 현재 값 표시 */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: `${position}%`,
          transform: 'translateX(-50%)',
          background: color,
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          zIndex: 4
        }}>
          {value.toFixed(2)}
        </div>
        
        {/* 최소값 */}
        <div style={{
          position: 'absolute',
          left: '0',
          bottom: '-25px',
          fontSize: '12px',
          color: '#8c8c8c',
          fontWeight: '500',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '2px 4px',
          borderRadius: '3px',
          whiteSpace: 'nowrap'
        }}>
          {min.toFixed(2)}
        </div>
        
        {/* 최대값 */}
        <div style={{
          position: 'absolute',
          right: '0',
          bottom: '-25px',
          fontSize: '12px',
          color: '#8c8c8c',
          fontWeight: '500',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '2px 4px',
          borderRadius: '3px',
          whiteSpace: 'nowrap'
        }}>
          {max.toFixed(2)}
        </div>
      </div>
    );
  };

  // 올바른 분류 기준에 맞게 수정
  const pulseTypes = {
    PVC: '부-평-침맥',
    BV: '활-평-삽맥',
    SV: '허-평-실맥',
    HR: '지-평-삭맥'
  };

  // 값에 따른 분류 결정 함수
  const getClassification = (key, value) => {
    const { min, max, avg } = normalRanges[key];
    if (value === undefined) return '평';
    
    const range = max - min;
    const deviation = value - avg;
    const deviationPercent = (deviation / (range / 2)) * 100;
    
    switch (key) {
      case 'PVC': // 부-평-침
        if (deviationPercent < -30) return '부';
        if (deviationPercent > 30) return '침';
        return '평';
      case 'BV': // 활-평-삽
        if (deviationPercent < -30) return '활';
        if (deviationPercent > 30) return '삽';
        return '평';
      case 'SV': // 허-평-실
        if (deviationPercent < -30) return '허';
        if (deviationPercent > 30) return '실';
        return '평';
      case 'HR': // 지-평-삭
        if (deviationPercent < -30) return '지';
        if (deviationPercent > 30) return '삭';
        return '평';
      default:
        return '평';
    }
  };

  const renderContent = () => {
    if (loading) return <div style={{ textAlign: 'center', padding: '48px 0' }}><Spin size="large" tip="맥상 정보 로딩 중..." /></div>;
    if (error) return <Alert message="오류" description={error} type="error" showIcon />;
    if (!pulseData) return <Alert message="선택된 맥상 정보가 없습니다." type="info" showIcon />;

    const {
      hanja, description, origin, relatedDiseases, management,
      physiology, systemicImpacts
    } = pulseData;

    return (
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={3} style={{ 
            marginTop: 0,
            background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            padding: '8px 0'
          }}>
            {pulseType}
            {hanja && <Text style={{ 
              marginLeft: 8,
              fontSize: '1.2rem',
              opacity: 0.7
            }}>{hanja}</Text>}
          </Title>
          <Paragraph style={{
            fontSize: '16px',
            color: '#666',
            lineHeight: '1.8',
            padding: '0 8px'
          }}>{description}</Paragraph>
        </Col>

        <Col span={24}>
          <SectionCard
            title="맥상 양상"
            icon={<FileTextOutlined />}
            gradient="linear-gradient(135deg, #40a9ff 0%, #1890ff 100%)"
          >
            <div style={{ padding: '24px' }}>
              {Object.entries(pulseValues).map(([key, value]) => {
                const range = normalRanges[key];
                const classification = getClassification(key, value);
                const ratio = getBarValue(key, value);
                const color = getBarColor(ratio);
                
                return (
                  <div key={key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '32px',
                    gap: '20px',
                    padding: '16px',
                    background: '#fafafa',
                    borderRadius: '12px',
                    border: '1px solid #e8e8e8'
                  }}>
                    <div style={{ width: '200px', flexShrink: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#333',
                        marginBottom: '8px'
                      }}>{key === 'PVC' ? '말초혈관수축도' :
                        key === 'BV' ? '혈관점탄도' :
                        key === 'SV' ? '일회박출량' :
                        '심박동수'}</div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: color,
                        background: 'rgba(255, 255, 255, 0.8)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        display: 'inline-block'
                      }}>{value.toFixed(2)}</div>
                    </div>
                    
                    <div style={{ flex: 1, position: 'relative', minHeight: '80px' }}>
                      <PulseBar 
                        ratio={ratio} 
                        value={value} 
                        color={color}
                        min={range.min}
                        max={range.max}
                        avg={range.avg}
                      />
                    </div>
                    
                    <div style={{ flexShrink: 0 }}>
                      <StyledTag color={ratio > 0.3 ? 'red' : ratio < -0.3 ? 'blue' : 'green'}>
                        {classification}맥
                      </StyledTag>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </Col>

        <Col span={24}>
          <SectionCard 
            title="관리 및 치료" 
            icon={<MedicineBoxOutlined />}
            gradient="linear-gradient(135deg, #52c41a 0%, #389e0d 100%)"
          >
            {management && management.herbal && (
              <>
                <Title level={5} style={{ color: '#389e0d' }}>추천 약재</Title>
                <Paragraph style={{ 
                  background: '#f6ffed', 
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #b7eb8f'
                }}>{management.herbal.join(', ')}</Paragraph>
              </>
            )}
            {management && management.acupuncture && (
              <>
                <Title level={5} style={{ color: '#389e0d', marginTop: '16px' }}>주요 경혈</Title>
                <Paragraph style={{ 
                  background: '#f6ffed', 
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #b7eb8f'
                }}>{management.acupuncture.join(', ')}</Paragraph>
              </>
            )}
            {management && management.lifestyle && (
              <>
                <Title level={5} style={{ color: '#389e0d', marginTop: '16px' }}>생활습관 가이드</Title>
                <Paragraph style={{ 
                  background: '#f6ffed', 
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #b7eb8f'
                }}>{management.lifestyle.join(', ')}</Paragraph>
              </>
            )}
          </SectionCard>
        </Col>
        
        <Col span={24}>
          <SectionCard 
            title="장부별 상세 영향" 
            icon={<ShareAltOutlined />}
            gradient="linear-gradient(135deg, #722ed1 0%, #531dab 100%)"
          >
            {systemicImpacts && (
              <Descriptions 
                layout="vertical" 
                bordered
                column={{ xs: 1, sm: 2, md: 3 }}
                style={{
                  background: 'white',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                {Object.entries(systemicImpacts).map(([organ, symptoms]) => {
                  const organInfo = ORGAN_LABELS[organ] || { emoji: '', label: organ };
                  return (
                    <Descriptions.Item 
                      key={organ} 
                      label={
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#722ed1'
                        }}>
                          {organInfo.emoji} {organInfo.label}
                        </span>
                      }
                      style={{
                        padding: '16px',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div style={{
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: '#666'
                      }}>
                        {Array.isArray(symptoms) ? symptoms.join(', ') : symptoms}
                      </div>
                    </Descriptions.Item>
                  );
                })}
              </Descriptions>
            )}
          </SectionCard>
        </Col>
      </Row>
    );
  };

  // PDF 저장 함수
  const handleSavePdf = () => {
    if (printRef.current) {
      html2pdf().from(printRef.current).save('맥상상세정보.pdf');
    }
  };

  // 인쇄 함수
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: '맥상상세정보',
  });

  return (
    <StyledModal
      title="맥상 상세 정보"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} type="primary" style={{
          background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
          border: 'none'
        }}>
          닫기
        </Button>
      ]}
      width="90vw"
      style={{ 
        maxWidth: '1200px',
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        margin: '0',
        padding: '0',
        zIndex: 9999,
        maxHeight: '70vh'
      }}
      centered={true}
      destroyOnHidden
      maskClosable={true}
      keyboard={true}
    >
      <GlobalStyle />
      <div className="print-hide" style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={handleSavePdf}
          style={{ 
            marginRight: 8,
            background: '#ff4d4f',
            border: 'none'
          }}
        >
          PDF로 저장
        </Button>
        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          style={{
            background: '#52c41a',
            border: 'none'
          }}
        >
          인쇄
        </Button>
      </div>
      <ScrollableContent 
        ref={printRef} 
        className="pulse-modal-scrollable"
        style={{
          height: 'calc(70vh - 120px)',
          maxHeight: 'calc(70vh - 120px)',
          overflowY: 'scroll',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: '#888 #f1f1f1'
        }}
      >
        {renderContent()}
      </ScrollableContent>
    </StyledModal>
  );
};

export default PulseInfoModal; 