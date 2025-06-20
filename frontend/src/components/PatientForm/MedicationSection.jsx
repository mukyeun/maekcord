import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Select, Typography, Form, Space, Tag } from 'antd';
import styled from 'styled-components';
import medicationIcon from '../../assets/icons/medication.svg';
import { 약물카테고리, 기호식품카테고리 } from '../../data/medications';

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

const FormItem = styled.div`
  margin-bottom: 16px;
`;

const FieldLabel = styled.div`
  margin-bottom: 4px;
  font-weight: 500;
`;

const StyledSelect = styled(Select)`
  width: 100% !important;
`;

const ErrorMessage = styled.div`
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
`;

const MedicationSection = ({ data, onChange, errors }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleMedicationChange = (values) => {
    onChange({
      ...data,
      medications: values
    });
  };

  const handlePreferenceSelect = (selected) => {
    const updatedPreferences = Array.isArray(data.preferences) 
      ? [...data.preferences, selected]
      : [selected];

    onChange({
      ...data,
      preferences: updatedPreferences
    });

    setDropdownVisible(false);
  };

  const handleDropdownVisibleChange = (visible) => {
    setDropdownVisible(visible);
  };

  const handlePreferenceRemove = (removedItem) => {
    const newPreferences = (data.preferences || []).filter(
      item => item !== removedItem
    );
    onChange({
      ...data,
      preferences: newPreferences
    });
  };

  return (
    <div>
      <SectionHeader>
        <img src={medicationIcon} alt="약물" className="section-icon" />
        <Title level={4}>복용약물</Title>
      </SectionHeader>

      <Wrapper>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12}>
            <FormItem>
              <FieldLabel>복용 중인 약물</FieldLabel>
              <StyledSelect
                mode="multiple"
                value={data.medications || []}
                onChange={handleMedicationChange}
                placeholder="약물을 선택하세요"
                status={errors?.medications ? 'error' : ''}
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {약물카테고리.map((item, index) => (
                  <Option key={`medication-${index}`} value={item}>
                    {item}
                  </Option>
                ))}
              </StyledSelect>
              {errors?.medications && (
                <ErrorMessage>{errors.medications}</ErrorMessage>
              )}
            </FormItem>
          </Col>

          <Col xs={24} sm={12}>
            <FormItem>
              <FieldLabel>기호식품</FieldLabel>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select
                  mode="multiple"
                  style={{ width: '100%' }}
                  placeholder="기호식품 선택"
                  value={data.preferences || []}
                  open={dropdownVisible}
                  onDropdownVisibleChange={handleDropdownVisibleChange}
                  onSelect={handlePreferenceSelect}
                  options={[
                    { value: '없음', label: '없음' },
                    { value: '커피', label: '커피' },
                    { value: '술', label: '술' },
                    { value: '담배', label: '담배' },
                    { value: '탄산음료', label: '탄산음료' }
                  ]}
                  tagRender={(props) => (
                    <Tag
                      closable
                      onClose={() => handlePreferenceRemove(props.value)}
                      style={{ marginRight: 3 }}
                    >
                      {props.label}
                    </Tag>
                  )}
                />
              </Space>
              {errors?.preferences && (
                <ErrorMessage>{errors.preferences}</ErrorMessage>
              )}
            </FormItem>
          </Col>
        </Row>
      </Wrapper>
    </div>
  );
};

MedicationSection.propTypes = {
  data: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object
};

export default MedicationSection;