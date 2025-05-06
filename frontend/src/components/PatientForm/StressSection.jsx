import React, { useState } from 'react';
import { Select, Tag, Typography, Form, Space, Row, Col } from 'antd';
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

// ✨ 스트레스 옵션 정의
const STRESS_OPTIONS = [
  { label: '없음', value: 'none' },
  { label: '약간', value: 'mild' },
  { label: '보통', value: 'moderate' },
  { label: '심함', value: 'severe' }
];

const StressSection = ({ formData = {}, onStressChange }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // ✅ 안전한 초기값 설정
  const stress = formData?.records?.stress || {};
  const selectedItems = stress?.items || [];
  const totalScore = stress?.totalScore || 0;
  const stressLevel = stress?.level || '낮음';
  const description = stress?.description || '';

  const handleCategorySelect = (value) => {
    setSelectedCategory(value);
  };

  const handleItemSelect = (value) => {
    if (!value) return;
    try {
      const item = JSON.parse(value);
      if (selectedItems.some((i) => i.name === item.name)) return;

      const updatedItems = [...selectedItems, item];
      const totalScore = updatedItems.reduce((sum, i) => sum + i.score, 0);
      const evaluation = evaluateStressLevel(totalScore);

      onStressChange({
        ...formData,
        records: {
          ...formData?.records,
          stress: {
            items: updatedItems,
            level: evaluation.level,
            totalScore,
            description: evaluation.description
          }
        }
      });
    } catch (err) {
      console.error('항목 파싱 오류:', err);
    }
  };

  const handleStressLevelChange = (itemName, selectedValue) => {
    const updatedItems = selectedItems.map(item => 
      item.name === itemName 
        ? { ...item, level: selectedValue } 
        : item
    );

    const totalScore = updatedItems.reduce((sum, i) => sum + i.score, 0);
    const evaluation = evaluateStressLevel(totalScore);

    onStressChange({
      ...formData,
      records: {
        ...formData?.records,
        stress: {
          items: updatedItems,
          level: evaluation.level,
          totalScore,
          description: evaluation.description
        }
      }
    });
  };

  // ✅ 스트레스 레벨 옵션 (value는 문자열로 통일)
  const STRESS_LEVELS = [
    { value: 'none', label: '없음' },
    { value: 'mild', label: '약간' },
    { value: 'moderate', label: '보통' },
    { value: 'severe', label: '심함' },
    { value: 'extreme', label: '매우 심함' }
  ];

  // ✅ 스트레스 필드 정의
  const STRESS_FIELDS = [
    { key: 'work', label: '업무 스트레스' },
    { key: 'home', label: '가정 스트레스' },
    { key: 'social', label: '대인관계 스트레스' },
    { key: 'financial', label: '경제적 스트레스' },
    { key: 'health', label: '건강 스트레스' },
    { key: 'other', label: '기타 스트레스' }
  ];

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
              optionFilterProp="children"
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
              optionFilterProp="children"
            >
              {selectedCategory &&
                스트레스카테고리
                  .find((cat) => cat.대분류 === selectedCategory)
                  ?.중분류.map((item) => (
                    <Select.Option
                      key={item.name}
                      value={JSON.stringify(item)}
                    >
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
              <div key={item.name} style={{ display: 'flex', gap: '8px' }}>
                <span style={{ width: '100px' }}>{item.name}:</span>
                <Select
                  style={{ width: '120px' }}
                  value={item.level}
                  options={STRESS_LEVELS}
                  onChange={(value) => handleStressLevelChange(item.name, value)}
                  placeholder="선택하세요"
                />
              </div>
            ))}
          </TagContainer>
        </FormItem>
      )}

      <EvaluationContainer>
        <div className="score">
          총점: {totalScore}점
        </div>
        <div className="level">
          <span>스트레스 수준:</span>
          <Tag color={
            stressLevel === '높음' ? 'error' :
            stressLevel === '중간' ? 'warning' : 'success'
          }>
            {stressLevel}
          </Tag>
          <span className="description">
            ({description})
          </span>
        </div>
      </EvaluationContainer>

      <FormItem>
        <div className="label">스트레스 상세</div>
        <StyledTextArea
          rows={4}
          placeholder="스트레스 상황에 대한 추가 설명"
          value={formData.stressDetails || ''}
          onChange={(e) => onStressChange({ ...formData, stressDetails: e.target.value })}
        />
      </FormItem>
    </StyledCard>
  );
};

// ✨ 기본 스트레스 항목
export const DEFAULT_STRESS_ITEMS = [
  { type: 'work', label: '업무', level: 'none' },
  { type: 'family', label: '가정', level: 'none' },
  { type: 'social', label: '대인관계', level: 'none' },
  { type: 'health', label: '건강', level: 'none' }
];

export default StressSection;
