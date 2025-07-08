import React, { useState, useEffect, useRef } from 'react';
import { Spin, Alert, Descriptions, Tag, Row, Col, Typography, Card, Modal, Button, Progress } from 'antd';
import { FileTextOutlined, MedicineBoxOutlined, BulbOutlined, LineChartOutlined, HeartOutlined, ShareAltOutlined, PrinterOutlined, FilePdfOutlined } from '@ant-design/icons';
import * as pulseApi from '../api/pulseApi';
import html2pdf from 'html2pdf.js';
import { useReactToPrint } from 'react-to-print';
import styled from 'styled-components';

const { Title, Text, Paragraph } = Typography;

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
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
  }
  
  .ant-modal-header {
    background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
    padding: 16px 24px;
    border-bottom: none;
    
    .ant-modal-title {
      color: white;
      font-size: 20px;
      font-weight: 600;
    }
  }

  .ant-modal-close {
    color: white;
  }
`;

const GradientCard = styled(Card)`
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .ant-card-head {
    background: ${props => props.gradient || 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)'};
    border-bottom: none;
    padding: 12px 20px;
    
    .ant-card-head-title {
      color: white;
      font-size: 16px;
      
      .anticon {
        margin-right: 8px;
      }
    }
  }

  .ant-card-body {
    padding: 20px;
    background: white;
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
    border-top: 6px solid currentColor;
  }
`;

const RangeValue = styled.div`
  position: absolute;
  font-size: 12px;
  color: #8c8c8c;
  top: 20px;
  transform: translateX(-50%);
  font-weight: 500;
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
      <ParameterBar>
        <CenterLine />
        <AverageLine data-value={avg.toFixed(2)} />
        <ValueMarker 
          style={{ 
            left: `${position}%`,
            background: color,
            color: color
          }} 
        />
        <RangeValue style={{ left: 0 }}>{min.toFixed(2)}</RangeValue>
        <RangeValue style={{ right: 0 }}>{max.toFixed(2)}</RangeValue>
      </ParameterBar>
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
            <div style={{ padding: '16px' }}>
              {Object.entries(pulseValues).map(([key, value]) => {
                const range = normalRanges[key];
                const classification = getClassification(key, value);
                const ratio = getBarValue(key, value);
                const color = getBarColor(ratio);
                const position = ((value - range.min) / (range.max - range.min)) * 100;
                
                return (
                  <ClassificationRow key={key}>
                    <ParameterInfo>
                      <ParameterName style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#333'
                      }}>{key === 'PVC' ? '말초혈관수축도' :
                        key === 'BV' ? '혈관점탄도' :
                        key === 'SV' ? '일회박출량' :
                        '심박동수'}</ParameterName>
                      <ParameterValue style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        color: color
                      }}>{value.toFixed(2)}</ParameterValue>
                    </ParameterInfo>
                    <PulseBar 
                      ratio={ratio} 
                      value={value} 
                      color={color}
                      min={range.min}
                      max={range.max}
                      avg={range.avg}
                    />
                    <StyledTag color={ratio > 0.3 ? 'red' : ratio < -0.3 ? 'blue' : 'green'}>
                      {classification}맥
                    </StyledTag>
                  </ClassificationRow>
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
      visible={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} type="primary" style={{
          background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
          border: 'none'
        }}>
          닫기
        </Button>
      ]}
      width={1000}
      centered
      destroyOnClose
    >
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
      <div ref={printRef}>
        {renderContent()}
      </div>
    </StyledModal>
  );
};

export default PulseInfoModal; 