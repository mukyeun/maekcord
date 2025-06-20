import React from 'react';
import { Input } from 'antd';
import { StyledCard, SectionTitle, FormItem } from './styles';
import memoIcon from '../../assets/icons/memo.svg';

const { TextArea } = Input;

const MemoSection = ({ data = '', onChange }) => {
  return (
    <StyledCard>
      <SectionTitle>
        <div className="icon-wrapper" style={{ 
          background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
          boxShadow: '0 4px 12px rgba(114, 46, 209, 0.15)'
        }}>
          <img src={memoIcon} alt="Memo" className="icon" />
        </div>
        <div className="title-text">
          메모
          <div className="subtitle">환자에 대한 추가적인 메모를 입력하세요</div>
        </div>
      </SectionTitle>

      <FormItem>
        <TextArea
          rows={4}
          value={data || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="특이사항, 주의사항 등을 자유롭게 입력하세요"
          style={{
            resize: 'vertical',
            minHeight: '120px',
            fontSize: '14px',
            lineHeight: '1.5',
            padding: '12px'
          }}
        />
      </FormItem>
    </StyledCard>
  );
};

export default MemoSection; 