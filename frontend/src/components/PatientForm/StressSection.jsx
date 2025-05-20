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

const StressSection = ({ formData = {}, onStressChange }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [stressLevel, setStressLevel] = useState('낮음');
  const [description, setDescription] = useState('');

  const details = formData?.records?.stress?.details || '';

  useEffect(() => {
    const score = selectedItems.reduce((sum, i) => sum + (i.score || 0), 0);
    const evaluation = evaluateStressLevel(score);
    setTotalScore(score);
    setStressLevel(evaluation.level);
    setDescription(evaluation.description);

    onStressChange({
      records: {
        ...formData.records,
        stress: {
          items: selectedItems,
          totalScore: score,
          level: evaluation.level,
          description: evaluation.description,
          details
        }
      }
    });
  }, [selectedItems]);

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
    const updatedDetails = e.target.value;
    setDescription(updatedDetails);

    onStressChange({
      records: {
        ...formData.records,
        stress: {
          items: selectedItems,
          totalScore,
          level: stressLevel,
          description,
          details: updatedDetails
        }
      }
    });
  };

  return (
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
              <Tag key={item.name} color="blue">
                {item.name} ({item.score}점)
              </Tag>
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
  );
};

export default StressSection;
