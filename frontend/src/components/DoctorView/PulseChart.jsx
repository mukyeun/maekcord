import React from 'react';
import { Card } from 'antd';

const PulseChart = ({ data }) => {
  return (
    <Card size="small" title="맥파 그래프">
      <div>Pulse Chart (그래프 구현 예정)</div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </Card>
  );
};

export default PulseChart; 