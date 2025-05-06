import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col, Input, Select, Typography } from 'antd';
import styled from 'styled-components';
import userInfoIcon from '../../assets/icons/user-info.svg';

const { Option } = Select;
const { Title } = Typography;

// Styled Components
const Wrapper = styled.div`
  padding: 24px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 24px;
  background-color: #fff;
`;

const FormItem = styled.div`
  margin-bottom: 16px;
`;

const FieldLabel = styled.div`
  margin-bottom: 4px;
  font-weight: 500;
`;

const StyledTextInput = styled(Input)`
  width: 100%;
`;

const StyledNumberInput = styled(Input)`
  width: 100%;
  height: 32px;
`;

const StyledSelect = styled(Select)`
  width: 100% !important;
`;

const HelpText = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 4px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  
  .section-icon {
    width: 24px;
    height: 24px;
    margin-right: 8px;
  }
`;

const PERSONALITY_OPTIONS = ['매우급함', '급함', '보통', '느긋', '매우 느긋'];
const WORK_INTENSITY_OPTIONS = ['매우 심함', '심함', '보통', '적음', '매우 적음'];

const BasicInfoSection = ({ data, onChange }) => {
  const handleInputChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const handleResidentNumberChange = (e) => {
    const input = e.target.value;
    const cleaned = input.replace(/[^\d-]/g, '');
    
    let formatted = cleaned;
    if (cleaned.length >= 6 && !cleaned.includes('-')) {
      formatted = `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`;
    }

    let gender = '';
    if (formatted.length >= 8) {
      const genderDigit = formatted.charAt(7);
      gender = ['1', '3', '5'].includes(genderDigit) ? '남' : '여';
    }

    const patientId = formatted.length >= 7 
      ? `${formatted.slice(0, 6)}${formatted.charAt(7)}`
      : '';

    onChange({
      ...data,
      residentNumber: formatted,
      gender,
      patientId
    });
  };

  const formatPhone = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 11);
    const parts = [
      cleaned.slice(0, 3),
      cleaned.slice(3, 7),
      cleaned.slice(7)
    ].filter(Boolean);
    return parts.join('-');
  };

  useEffect(() => {
    if (data.height && data.weight) {
      const heightInMeters = Number(data.height) / 100;
      const bmi = (Number(data.weight) / (heightInMeters * heightInMeters)).toFixed(1);
      handleInputChange('bmi', bmi);
    }
  }, [data.height, data.weight]);

  return (
    <div>
      <SectionHeader>
        <img src={userInfoIcon} alt="기본정보" className="section-icon" />
        <Title level={4}>기본 정보</Title>
      </SectionHeader>

      <Wrapper>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <FormItem>
              <FieldLabel>이름</FieldLabel>
              <StyledTextInput 
                value={data.name || ''} 
                onChange={(e) => handleInputChange('name', e.target.value)} 
              />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem>
              <FieldLabel>주민등록번호</FieldLabel>
              <StyledTextInput
                value={data.residentNumber || ''}
                onChange={handleResidentNumberChange}
                placeholder="000000-0000000"
                maxLength={14}
              />
              <HelpText>숫자만 입력하세요 (최대 14자리, 하이픈 자동 삽입)</HelpText>
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem>
              <FieldLabel>성별</FieldLabel>
              <StyledTextInput
                value={data.gender || ''}
                readOnly
                placeholder="주민번호 입력 시 자동 입력"
              />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem>
              <FieldLabel>연락처</FieldLabel>
              <StyledTextInput 
                value={data.phone || ''} 
                onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))} 
              />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem>
              <FieldLabel>성격</FieldLabel>
              <StyledSelect
                value={data.personality || undefined}
                onChange={(value) => handleInputChange('personality', value)}
                placeholder="선택"
              >
                {PERSONALITY_OPTIONS.map((v) => (
                  <Option key={v} value={v}>{v}</Option>
                ))}
              </StyledSelect>
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem>
              <FieldLabel>노동강도</FieldLabel>
              <StyledSelect
                value={data.workIntensity || undefined}
                onChange={(value) => handleInputChange('workIntensity', value)}
                placeholder="선택"
              >
                {WORK_INTENSITY_OPTIONS.map((v) => (
                  <Option key={v} value={v}>{v}</Option>
                ))}
              </StyledSelect>
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem>
              <FieldLabel>신장 (cm)</FieldLabel>
              <StyledNumberInput 
                type="number"
                value={data.height || ''} 
                onChange={(e) => handleInputChange('height', e.target.value)} 
              />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem>
              <FieldLabel>체중 (kg)</FieldLabel>
              <StyledNumberInput 
                type="number"
                value={data.weight || ''} 
                onChange={(e) => handleInputChange('weight', e.target.value)} 
              />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem>
              <FieldLabel>BMI</FieldLabel>
              <StyledTextInput 
                value={data.bmi || ''} 
                readOnly 
              />
            </FormItem>
          </Col>
        </Row>
      </Wrapper>
    </div>
  );
};

BasicInfoSection.propTypes = {
  data: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default BasicInfoSection;
