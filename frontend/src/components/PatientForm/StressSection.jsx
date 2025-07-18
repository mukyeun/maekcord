import React, { useState, useEffect } from 'react';
import { Select, Tag, Form } from 'antd';
import {
  StyledCard,
  SectionTitle,
  FormItem,
  SelectContainer,
  SelectWrapper,
  StyledSelect,
  TagContainer,
  EvaluationContainer,
  StyledTextArea
} from './styles';
import stressIcon from '../../assets/icons/stress.svg';
import { 스트레스카테고리, evaluateStressLevel } from '../../data/stressEvents';
import styled from 'styled-components';

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

const StyledTag = styled(Tag)`
  margin: 4px;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  
  &:hover {
    opacity: 0.9;
    transform: scale(0.98);
  }
  
  .anticon-close {
    color: #ffffff;
    margin-left: 6px;
    font-size: 12px;
    opacity: 0.85;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 50%;
    padding: 2px;
    
    &:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.25);
    }
  }

  &.ant-tag-blue {
    .anticon-close {
      color: #ffffff;
    }
  }
`;

const StressSection = ({ formData = {}, onStressChange }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedItems, setSelectedItems] = useState(formData.stress?.items || []);
  const [totalScore, setTotalScore] = useState(0);
  const [stressLevel, setStressLevel] = useState('낮음');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState(formData.stress?.details || '');

  useEffect(() => {
    // formData.stress가 undefined거나 null이면 아무것도 하지 않음
    if (!formData.stress) return;

    // items가 다를 때만 set
    if (
      JSON.stringify(formData.stress.items) !== JSON.stringify(selectedItems)
    ) {
      setSelectedItems(formData.stress.items || []);
    }

    // details가 다를 때만 set
    if (
      (formData.stress.details || '') !== details
    ) {
      setDetails(formData.stress.details || '');
    }
    // eslint-disable-next-line
  }, [formData.stress]);

  useEffect(() => {
    const score = selectedItems.reduce((sum, i) => sum + (i.score || 0), 0);
    const evaluation = evaluateStressLevel(score);
    setTotalScore(score);
    setStressLevel(evaluation.level);
    setDescription(evaluation.description);

    console.log('[StressSection] onStressChange 전달값:', {
      items: selectedItems,
      totalScore: score,
      score,
      level: evaluation.level,
      description: evaluation.description,
      details
    });

    onStressChange({
      items: selectedItems,
      totalScore: score,
      score,
      level: evaluation.level,
      description: evaluation.description,
      details
    });
  }, [selectedItems, details]);

  const handleCategorySelect = (value) => {
    setSelectedCategory(value);
  };

  const handleItemSelect = (value) => {
    try {
      const item = JSON.parse(value);
      if (selectedItems.find((i) => i.name === item.name)) return;
      setSelectedItems([...selectedItems, item]);
    } catch (err) {
      console.error('항목 파싱 오류:', err);
    }
  };

  const handleDetailsChange = (e) => {
    setDetails(e.target.value);
  };

  const handleRemoveItem = (itemToRemove) => {
    setSelectedItems(selectedItems.filter(item => item.name !== itemToRemove.name));
  };

  return (
    <SectionCard>
      <StyledCard>
        <SectionTitle>
          <div className="icon-wrapper">
            <img src={stressIcon} alt="스트레스" className="icon" />
          </div>
          <div className="title-text">
            스트레스 평가
            <div className="subtitle">스트레스 항목을 선택하여 수준을 평가하세요</div>
          </div>
        </SectionTitle>

        <SelectContainer>
          <SelectWrapper>
            <FormItem>
              <div className="label">대분류</div>
              <StyledSelect
                value={selectedCategory}
                onChange={handleCategorySelect}
                placeholder="선택하세요"
                showSearch
              >
                {스트레스카테고리.map((cat) => (
                  <Select.Option key={cat.대분류} value={cat.대분류}>
                    {cat.대분류}
                  </Select.Option>
                ))}
              </StyledSelect>
            </FormItem>
          </SelectWrapper>

          <SelectWrapper>
            <FormItem>
              <div className="label">세부 항목</div>
              <StyledSelect
                onChange={handleItemSelect}
                placeholder="선택하세요"
                disabled={!selectedCategory}
                showSearch
              >
                {selectedCategory &&
                  스트레스카테고리
                    .find((cat) => cat.대분류 === selectedCategory)
                    ?.중분류.map((item) => (
                      <Select.Option key={item.name} value={JSON.stringify(item)}>
                        {item.name} ({item.score}점)
                      </Select.Option>
                    ))}
              </StyledSelect>
            </FormItem>
          </SelectWrapper>
        </SelectContainer>

        {selectedItems.length > 0 && (
          <FormItem>
            <div className="label">선택된 항목</div>
            <TagContainer>
              {selectedItems.map((item) => (
                <StyledTag
                  key={item.name}
                  color="blue"
                  closable
                  onClose={() => handleRemoveItem(item)}
                >
                  {item.name} ({item.score}점)
                </StyledTag>
              ))}
            </TagContainer>
          </FormItem>
        )}

        <EvaluationContainer>
          <div className="score">총점: {totalScore}점</div>
          <div className="level">
            스트레스 수준:&nbsp;
            <Tag
              color={
                stressLevel === '높음'
                  ? 'error'
                  : stressLevel === '중간'
                  ? 'warning'
                  : 'success'
              }
            >
              {stressLevel}
            </Tag>
            <span className="description">({description})</span>
          </div>
        </EvaluationContainer>

        <FormItem>
          <div className="label">스트레스 상세</div>
          <StyledTextArea
            rows={4}
            value={details}
            placeholder="스트레스 상황에 대한 추가 설명"
            onChange={handleDetailsChange}
          />
        </FormItem>
      </StyledCard>
    </SectionCard>
  );
};

export default StressSection;