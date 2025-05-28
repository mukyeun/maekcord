import React from 'react';
import { Input } from 'antd';

const { TextArea } = Input;

const FinalOpinionMemo = () => {
  return (
    <TextArea
      rows={4}
      placeholder="진단 소견을 입력하세요..."
      style={{ marginTop: '8px' }}
    />
  );
};

export default FinalOpinionMemo; 