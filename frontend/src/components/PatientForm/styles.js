import styled from 'styled-components';
import { Card, Select, Input } from 'antd';

export const StyledCard = styled(Card)`
  margin-bottom: 24px;
`;

export const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;

  .icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;

    .icon {
      width: 24px;
      height: 24px;
    }
  }

  .title-text {
    font-size: 18px;
    font-weight: 600;

    .subtitle {
      font-size: 14px;
      color: #666;
      font-weight: normal;
    }
  }
`;

export const FormItem = styled.div`
  margin-bottom: 16px;

  .label {
    margin-bottom: 8px;
    font-weight: 500;
  }

  .error-message {
    color: #ff4d4f;
    font-size: 14px;
    margin-top: 4px;
  }
`;

export const SelectContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
`;

export const SelectWrapper = styled.div`
  flex: 1;
`;

export const StyledSelect = styled(Select)`
  width: 100%;
`;

export const TagContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const EvaluationContainer = styled.div`
  margin: 16px 0;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;

  .score, .level, .count {
    margin-bottom: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }

  .description {
    color: #666;
    margin-left: 8px;
  }
`;

export const StyledTextArea = styled(Input.TextArea)`
  resize: vertical;
  min-height: 120px;
`;

// 결과 컨테이너
export const ResultsContainer = styled.div`
  padding: 16px;
`;

// 컨트롤 컨테이너
export const ControlsContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

// 웨이브 데이터 그리드
export const WaveDataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 24px;
`;

// 입력 그룹
export const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

// 라벨
export const Label = styled.label`
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 4px;
`;

// 스타일된 입력
export const StyledInput = styled(Input)`
  &[type="number"] {
    -moz-appearance: textfield;
  }
  
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`; 