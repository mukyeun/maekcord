import React from 'react';
import { Card, Progress, Descriptions } from 'antd';

const StressAnalysis = ({ stressData }) => {
  return (
    <Card title="스트레스 분석">
      <Descriptions bordered>
        <Descriptions.Item label="스트레스 대분류" span={3}>
          {stressData.category}
        </Descriptions.Item>
        <Descriptions.Item label="스트레스 소분류" span={3}>
          {stressData.subCategory}
        </Descriptions.Item>
      </Descriptions>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Progress
          type="dashboard"
          percent={stressData.level}
          format={percent => `스트레스 수준 ${percent}%`}
        />
      </div>
    </Card>
  );
};

export default StressAnalysis; 