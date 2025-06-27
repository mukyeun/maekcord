import React from 'react';
import { Input } from 'antd';
import { StyledCard, SectionTitle, FormItem } from './styles';
import memoIcon from '../../assets/icons/memo.svg';
import styled from 'styled-components';

const { TextArea } = Input;

const SectionCard = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(25, 118, 210, 0.08);
  border: 1px solid ${({ theme }) => theme.border};
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.text};
  @media (max-width: 700px) {
    padding: 1rem;
  }
`;

const MemoSection = ({ data = '', onChange }) => {
  return (
    <SectionCard>
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
    </SectionCard>
  );
};

export default MemoSection; 