import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';

const PulseAnalysis = ({ data }) => {
  return (
    <Card size="small" title="맥파 분석">
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Statistic title="PVC" value={data?.pvc || '-'} />
        </Col>
        <Col span={6}>
          <Statistic title="BV" value={data?.bv || '-'} />
        </Col>
        <Col span={6}>
          <Statistic title="SV" value={data?.sv || '-'} />
        </Col>
        <Col span={6}>
          <Statistic title="HR" value={data?.hr || '-'} />
        </Col>
      </Row>
    </Card>
  );
};

export default PulseAnalysis; 