// ✅ SymptomSection.jsx
import React, { useState } from 'react';
import { Select, Tag, Input } from 'antd';
import styled from 'styled-components';
import { StyledCard, SectionTitle, FormItem } from './styles';
import { 증상카테고리 } from '../../data/symptoms';
import symptomIcon from '../../assets/icons/symptoms.svg';

const { TextArea } = Input;

const SelectContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  width: 100%;
`;

const SelectWrapper = styled.div`
  flex: 1;
  min-width: 250px;
  @media (max-width: 768px) {
    min-width: 100%;
  }
`;

const StyledSelect = styled(Select)`
  width: 100% !important;
  .ant-select-selector {
    border-radius: 8px !important;
    height: 40px !important;
    padding: 4px 11px !important;
    display: flex;
    align-items: center;
    .ant-select-selection-search-input {
      height: 38px !important;
    }
    .ant-select-selection-placeholder {
      line-height: 32px;
    }
  }
  &.ant-select-disabled .ant-select-selector {
    background-color: #f5f5f5 !important;
    cursor: not-allowed;
  }
`;

const StyledTextArea = styled(TextArea)`
  width: 100% !important;
  min-width: 100% !important;
  box-sizing: border-box;
  border-radius: 8px;
  resize: vertical;
  min-height: 120px;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px;
  &:hover,
  &:focus {
    border-color: #13c2c2;
    box-shadow: 0 0 0 2px rgba(19, 194, 194, 0.1);
  }
  &::placeholder {
    color: #bfbfbf;
  }
`;

const TagContainer = styled.div`
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  min-height: 50px;
  margin-bottom: 16px;
  width: 100%;
  .ant-tag {
    margin: 4px;
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 14px;
    cursor: pointer;
    background: white;
    border: 1px solid #d9d9d9;
    &:hover {
      border-color: #13c2c2;
      color: #13c2c2;
    }
    .anticon-close {
      color: #999;
      &:hover {
        color: #13c2c2;
      }
    }
  }
`;

const SymptomSection = ({ data = [], onChange, errors }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setSelectedSubCategory('');
  };

  const handleSubCategoryChange = (value) => {
    setSelectedSubCategory(value);
  };

  const handleSymptomSelect = (value) => {
    if (!value) return;
    if (!data.includes(value)) {
      const newSymptoms = [...data, value];
      console.log('[SymptomSection] 선택된 증상:', newSymptoms);
      onChange(newSymptoms);
    }
  };

  const handleSymptomRemove = (symptomToRemove) => {
    onChange(data.filter(s => s !== symptomToRemove));
  };

  return (
    <StyledCard>
      <SectionTitle>
        <div className="icon-wrapper" style={{ background: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)' }}>
          <img src={symptomIcon} alt="증상" className="icon" />
        </div>
        <div className="title-text">
          증상<div className="subtitle">현재 겪고 있는 증상을 선택해주세요</div>
        </div>
      </SectionTitle>

      <SelectContainer>
        <SelectWrapper>
          <FormItem>
            <div className="label">대분류</div>
            <StyledSelect
              value={selectedCategory}
              onChange={handleCategoryChange}
              placeholder="선택하세요"
              showSearch
              optionFilterProp="children"
              status={errors?.category ? 'error' : ''}
            >
              {Object.keys(증상카테고리).map(category => (
                <Select.Option key={category} value={category}>{category}</Select.Option>
              ))}
            </StyledSelect>
            {errors?.category && <div className="error-message">{errors.category}</div>}
          </FormItem>
        </SelectWrapper>

        <SelectWrapper>
          <FormItem>
            <div className="label">중분류</div>
            <StyledSelect
              value={selectedSubCategory}
              onChange={handleSubCategoryChange}
              placeholder="선택하세요"
              disabled={!selectedCategory}
              showSearch
              optionFilterProp="children"
              status={errors?.subCategory ? 'error' : ''}
            >
              {selectedCategory &&
                Object.keys(증상카테고리[selectedCategory]).map(subCategory => (
                  <Select.Option key={subCategory} value={subCategory}>{subCategory}</Select.Option>
                ))}
            </StyledSelect>
            {errors?.subCategory && <div className="error-message">{errors.subCategory}</div>}
          </FormItem>
        </SelectWrapper>

        <SelectWrapper>
          <FormItem>
            <div className="label">소분류</div>
            <StyledSelect
              onChange={handleSymptomSelect}
              placeholder="선택하세요"
              disabled={!selectedSubCategory}
              showSearch
              optionFilterProp="children"
              status={errors?.symptoms ? 'error' : ''}
            >
              {selectedSubCategory &&
                증상카테고리[selectedCategory][selectedSubCategory].map(symptom => (
                  <Select.Option key={symptom.name} value={symptom.name}>{symptom.name}</Select.Option>
                ))}
            </StyledSelect>
            {errors?.symptoms && <div className="error-message">{errors.symptoms}</div>}
          </FormItem>
        </SelectWrapper>
      </SelectContainer>

      {data.length > 0 && (
        <FormItem>
          <div className="label">선택된 증상</div>
          <TagContainer>
            {data.map((symptom, index) => (
              <Tag key={index} closable onClose={() => handleSymptomRemove(symptom)}>{symptom}</Tag>
            ))}
          </TagContainer>
        </FormItem>
      )}

      <FormItem style={{ width: '100%' }}>
        <div className="label">증상 상세</div>
        <StyledTextArea
          placeholder="증상에 대해 자세히 설명해주세요"
          rows={4}
          status={errors?.symptomDetails ? 'error' : ''}
        />
        {errors?.symptomDetails && <div className="error-message">{errors.symptomDetails}</div>}
      </FormItem>
    </StyledCard>
  );
};

export default SymptomSection;
