import React, { useState, useEffect } from 'react';
import { Spin, Alert, Descriptions, Tag, Row, Col, Typography, Card, Modal, Button } from 'antd';
import { FileTextOutlined, MedicineBoxOutlined, BulbOutlined, LineChartOutlined, HeartOutlined, ShareAltOutlined } from '@ant-design/icons';
import * as pulseApi from '../api/pulseApi';

const { Title, Text, Paragraph } = Typography;

const SectionCard = ({ title, icon, children }) => (
  <Card 
    title={<span>{icon} {title}</span>} 
    bordered={false} 
    style={{ marginBottom: '16px' }}
  >
    {children}
  </Card>
);

const PulseInfoModal = ({ isOpen, onClose, pulseType }) => {
  const [pulseData, setPulseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const renderContent = () => {
    if (loading) return <div style={{ textAlign: 'center', padding: '48px 0' }}><Spin size="large" tip="맥상 정보 로딩 중..." /></div>;
    if (error) return <Alert message="오류" description={error} type="error" showIcon />;
    if (!pulseData) return <Alert message="선택된 맥상 정보가 없습니다." type="info" showIcon />;

    const {
      hanja, description, origin, relatedDiseases, management,
      physiology, systemicImpacts
    } = pulseData;

    return (
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Title level={3} style={{ marginTop: 0 }}>
            {pulseType}
            {hanja && <Text type="secondary" style={{ marginLeft: 8, fontSize: '1.2rem' }}>{hanja}</Text>}
          </Title>
          <Paragraph type="secondary">{description}</Paragraph>
        </Col>

        <Col xs={24} md={12}>
          <SectionCard title="맥상 개요" icon={<FileTextOutlined />}>
            <Descriptions column={1} bordered>
              {origin && <Descriptions.Item label="주요 원인">{origin.join(', ')}</Descriptions.Item>}
              {relatedDiseases && <Descriptions.Item label="관련 질환">{relatedDiseases.join(', ')}</Descriptions.Item>}
            </Descriptions>
          </SectionCard>

          <SectionCard title="생리학적 특성" icon={<HeartOutlined />}>
            {physiology && (
              <Descriptions column={1} bordered>
                {Object.entries(physiology).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    <Tag color={value === '높음' ? 'red' : value === '낮음' ? 'blue' : 'default'}>{value || '정상'}</Tag>
                  </Descriptions.Item>
                ))}
              </Descriptions>
            )}
          </SectionCard>
        </Col>

        <Col xs={24} md={12}>
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
                {Object.entries(systemicImpacts).map(([organ, symptoms]) => (
                  <Descriptions.Item key={organ} label={organ}>
                    {Array.isArray(symptoms) ? symptoms.join(', ') : symptoms}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            )}
          </SectionCard>
        </Col>
      </Row>
    );
  };
  
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
      {renderContent()}
    </Modal>
  );
};

export default PulseInfoModal; 