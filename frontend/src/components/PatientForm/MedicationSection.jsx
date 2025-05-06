import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Select, Typography } from 'antd';
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
  const handleMedicationChange = (values) => {
    onChange({
      ...data,
      medications: values
    });
  };

  const handlePreferenceChange = (values) => {
    onChange({
      ...data,
      preferences: values
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
              <StyledSelect
                mode="multiple"
                value={data.preferences || []}
                onChange={handlePreferenceChange}
                placeholder="기호식품을 선택하세요"
                status={errors?.preferences ? 'error' : ''}
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {기호식품카테고리.map((item, index) => (
                  <Option key={`preference-${index}`} value={item}>
                    {item}
                  </Option>
                ))}
              </StyledSelect>
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
