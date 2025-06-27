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

const SectionCard = ({ title, icon, children, style, bodyStyle }) => (
  <Card 
    title={<span>{icon} {title}</span>} 
    bordered={false} 
    style={style}
    bodyStyle={bodyStyle}
  >
    {children}
  </Card>
);

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
        PVC: patientPulseData.PVC || 50,
        BV: patientPulseData.BV || 60,
        SV: patientPulseData.SV || 70,
        HR: patientPulseData.HR || 80
      };
    }

    // 환자 데이터가 없으면 맥상 타입에 따라 예시값 설정
    const baseValues = {
      PVC: 50, // 중간값 (부-중-침)
      BV: 60,  // 중간값 (활-중-삽)
      SV: 70,  // 중간값 (허-중-실)
      HR: 80   // 중간값 (지-중-삭)
    };

    // 맥상 타입에 따라 값 조정 (예시)
    if (pulseType?.includes('부')) {
      baseValues.PVC = 30; // 부맥: 낮은 값
    }
    if (pulseType?.includes('침')) {
      baseValues.PVC = 70; // 침맥: 높은 값
    }
    if (pulseType?.includes('활')) {
      baseValues.BV = 40; // 활맥: 낮은 값
    }
    if (pulseType?.includes('삽')) {
      baseValues.BV = 80; // 삽맥: 높은 값
    }
    if (pulseType?.includes('허')) {
      baseValues.SV = 50; // 허맥: 낮은 값
    }
    if (pulseType?.includes('실')) {
      baseValues.SV = 90; // 실맥: 높은 값
    }
    if (pulseType?.includes('지')) {
      baseValues.HR = 60; // 지맥: 낮은 값
    }
    if (pulseType?.includes('삭')) {
      baseValues.HR = 100; // 삭맥: 높은 값
    }

    return baseValues;
  };

  const pulseValues = getPulseValues();
  
  const normalRanges = {
    PVC: { min: 60, max: 90 },
    BV: { min: 7, max: 10 },
    SV: { min: 55, max: 70 },
    HR: { min: 65, max: 85 }
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

  // 올바른 분류 기준에 맞게 수정
  const pulseTypes = {
    PVC: '부-중-침맥',
    BV: '활-중-삽맥',
    SV: '허-중-실맥',
    HR: '지-중-삭맥'
  };

  // 값에 따른 분류 결정 함수
  const getClassification = (key, value) => {
    const { min, max, avg } = normalRanges[key];
    if (value === undefined) return '중';
    
    const range = max - min;
    const deviation = value - avg;
    const deviationPercent = (deviation / (range / 2)) * 100;
    
    switch (key) {
      case 'PVC': // 부-중-침
        if (deviationPercent < -30) return '부';
        if (deviationPercent > 30) return '침';
        return '중';
      case 'BV': // 활-중-삽
        if (deviationPercent < -30) return '활';
        if (deviationPercent > 30) return '삽';
        return '중';
      case 'SV': // 허-중-실
        if (deviationPercent < -30) return '허';
        if (deviationPercent > 30) return '실';
        return '중';
      case 'HR': // 지-중-삭
        if (deviationPercent < -30) return '지';
        if (deviationPercent > 30) return '삭';
        return '중';
      default:
        return '중';
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
      <Row gutter={[8, 8]}>
        <Col span={24}>
          <Title level={3} style={{ marginTop: 0 }}>
            {pulseType}
            {hanja && <Text type="secondary" style={{ marginLeft: 8, fontSize: '1.2rem' }}>{hanja}</Text>}
          </Title>
          <Paragraph type="secondary">{description}</Paragraph>
        </Col>

        <Col span={24}>
          <SectionCard
            title="맥상 양상"
            icon={<FileTextOutlined />}
            style={{ marginBottom: 8 }}
            bodyStyle={{ padding: 8 }}
          >
            <Descriptions column={1} bordered size="small">
              {Object.entries(pulseValues).map(([key, value]) => {
                const classification = getClassification(key, value);
                const ratio = getBarValue(key, value);
                const color = getBarColor(ratio);
                
                return (
                  <Descriptions.Item
                    key={key}
                    label={`${key} (${pulseTypes[key]}, ${classification}맥)`}
                    labelStyle={{ width: 180, minWidth: 150, maxWidth: 220, whiteSpace: 'normal' }}
                    contentStyle={{ textAlign: 'center', padding: '0 8px' }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <PulseBar
                        ratio={ratio}
                        value={value}
                        color={color}
                      />
                      <Tag 
                        color={ratio > 0.3 ? 'red' : ratio < -0.3 ? 'blue' : 'green'} 
                        size="small" 
                        style={{ marginLeft: 8 }}
                      >
                        {classification}맥
                      </Tag>
                    </div>
                  </Descriptions.Item>
                );
              })}
            </Descriptions>
          </SectionCard>

          <SectionCard title="관리 및 치료" icon={<MedicineBoxOutlined />}>
            {management && management.herbal && (
              <>
                <Title level={5}>추천 약재</Title>
                <Paragraph>{management.herbal.join(', ')}</Paragraph>
              </>
            )}
            {management && management.acupuncture && (
               <>
                <Title level={5}>주요 경혈</Title>
                <Paragraph>{management.acupuncture.join(', ')}</Paragraph>
              </>
            )}
            {management && management.lifestyle && (
               <>
                <Title level={5}>생활습관 가이드</Title>
                <Paragraph>{management.lifestyle.join(', ')}</Paragraph>
              </>
            )}
          </SectionCard>
        </Col>
        
        <Col span={24}>
           <SectionCard title="장부별 상세 영향" icon={<ShareAltOutlined />}>
            {systemicImpacts && (
              <Descriptions layout="vertical" bordered>
                {Object.entries(systemicImpacts).map(([organ, symptoms]) => {
                  const organInfo = ORGAN_LABELS[organ] || { emoji: '', label: organ };
                  return (
                    <Descriptions.Item key={organ} label={<span>{organInfo.emoji} {organInfo.label}</span>}>
                      {Array.isArray(symptoms) ? symptoms.join(', ') : symptoms}
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
    <Modal
      title="맥상 상세 정보"
      visible={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          닫기
        </Button>
      ]}
      width={1000}
      centered
      destroyOnClose
    >
      {/* 인쇄용 상단 병원명 */}
      <div className="print-only" style={{ display: 'none', textAlign: 'center', marginBottom: 24, fontSize: 24, fontWeight: 700 }}>
        도원한의원
      </div>
      <div className="print-hide" style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={handleSavePdf}
          style={{ marginRight: 8 }}
        >
          PDF로 저장
        </Button>
        <Button
          type="default"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
        >
          인쇄
        </Button>
      </div>
      <div ref={printRef}>
        {error && (
          <Alert message="오류" description={error} type="error" showIcon style={{ marginBottom: 16 }} />
        )}
        <Spin spinning={loading} tip="불러오는 중...">
          {renderContent()}
        </Spin>
        {/* 인쇄용 하단 안내문구 */}
        <div className="print-only" style={{ display: 'none', textAlign: 'center', marginTop: 32, fontSize: 16, color: '#888' }}>
          문의: 051-612-0120
        </div>
      </div>
    </Modal>
  );
};

export default PulseInfoModal; 