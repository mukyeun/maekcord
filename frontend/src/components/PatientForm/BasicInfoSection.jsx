import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col, Input, Select, Typography, AutoComplete, message, Button, Modal, List, Avatar, Space, Tag } from 'antd';
import styled from 'styled-components';
import { SearchOutlined, UserOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import userInfoIcon from '../../assets/icons/user-info.svg';
import { searchPatient } from '../../api/patientApi';

const { Option } = Select;
const { Title, Text } = Typography;

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

const StyledAutoComplete = styled(AutoComplete)`
  width: 100%;
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

const PatientOption = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  
  .patient-info {
    flex: 1;
  }
  
  .patient-name {
    font-weight: 500;
    color: #262626;
  }
  
  .patient-details {
    font-size: 12px;
    color: #8c8c8c;
    margin-top: 2px;
  }
  
  .select-hint {
    font-size: 11px;
    color: #1890ff;
    font-style: italic;
  }
`;

const SearchButton = styled(Button)`
  margin-left: 8px;
  height: 32px;
`;

const SearchResultItem = styled.div`
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #1890ff;
    background-color: #f6ffed;
  }
  
  .patient-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .patient-name {
    font-weight: 600;
    font-size: 16px;
    color: #262626;
  }
  
  .patient-id {
    font-size: 12px;
    color: #8c8c8c;
  }
  
  .patient-details {
    display: flex;
    gap: 16px;
    font-size: 14px;
    color: #595959;
  }
  
  .detail-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const PERSONALITY_OPTIONS = ['매우급함', '급함', '보통', '느긋', '매우 느긋'];
const WORK_INTENSITY_OPTIONS = ['매우 심함', '심함', '보통', '적음', '매우 적음'];

// 성별 판단 함수
const determineGender = (residentNumber) => {
  const code = residentNumber?.split('-')[1]?.[0];
  if (['1', '3', '5'].includes(code)) return 'male';
  if (['2', '4', '6'].includes(code)) return 'female';
  return '';
};

// 성별 표시 매핑
const GENDER_DISPLAY = {
  male: '남성',
  female: '여성',
  '': ''
};

const BasicInfoSection = ({ data, onChange }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [manualSearchResults, setManualSearchResults] = useState([]);
  const [manualSearching, setManualSearching] = useState(false);

  const handleInputChange = (field, value) => {
    console.log(`✏️ ${field} 변경:`, value);
    onChange({
      ...data,
      [field]: value
    });
  };

  // 환자 검색 함수 (자동완성용)
  const handleNameSearch = async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await searchPatient({ 
        search: searchText,
        limit: 10 
      });
      
      if (response?.success && response?.patients) {
        setSearchResults(response.patients);
      }
    } catch (error) {
      console.error('환자 검색 오류:', error);
      message.error('환자 검색 중 오류가 발생했습니다.');
    } finally {
      setSearching(false);
    }
  };

  // 수동 환자 검색 함수
  const handleManualSearch = async () => {
    const searchTerms = [];
    
    if (data.name) searchTerms.push(data.name);
    if (data.phone) searchTerms.push(data.phone);
    if (data.residentNumber) searchTerms.push(data.residentNumber);
    
    if (searchTerms.length === 0) {
      message.warning('검색할 정보를 입력해주세요. (이름, 연락처, 주민등록번호 중 하나)');
      return;
    }

    try {
      setManualSearching(true);
      const searchQuery = searchTerms.join(' ');
      const response = await searchPatient({ 
        search: searchQuery,
        limit: 20 
      });
      
      if (response?.success && response?.patients) {
        setManualSearchResults(response.patients);
        setSearchModalVisible(true);
        
        if (response.patients.length === 0) {
          message.info('검색 결과가 없습니다. 새로운 환자로 등록해주세요.');
        }
      }
    } catch (error) {
      console.error('환자 검색 오류:', error);
      message.error('환자 검색 중 오류가 발생했습니다.');
    } finally {
      setManualSearching(false);
    }
  };

  // 주민번호 기반 환자 검색
  const handleResidentNumberSearch = async (residentNumber) => {
    if (!residentNumber || residentNumber.length < 13) {
      return;
    }

    try {
      const response = await searchPatient({ 
        search: residentNumber,
        limit: 5 
      });
      
      if (response?.success && response?.patients?.length > 0) {
        const matchingPatient = response.patients.find(p => 
          p.basicInfo?.residentNumber === residentNumber
        );
        
        if (matchingPatient) {
          message.info(`${matchingPatient.basicInfo.name}님의 기존 정보가 발견되었습니다. 이름 필드에서 선택하여 정보를 불러올 수 있습니다.`);
        }
      }
    } catch (error) {
      console.error('주민번호 검색 오류:', error);
    }
  };

  // 기존 환자 선택 시 정보 자동 채우기
  const handlePatientSelect = (patientId) => {
    const selectedPatient = searchResults.find(p => p.basicInfo?.patientId === patientId);
    if (selectedPatient) {
      fillPatientData(selectedPatient);
    }
  };

  // 수동 검색 결과에서 환자 선택
  const handleManualPatientSelect = (patient) => {
    fillPatientData(patient);
    setSearchModalVisible(false);
    setManualSearchResults([]);
  };

  // 환자 데이터로 폼 채우기
  const fillPatientData = (patient) => {
    const basicInfo = patient.basicInfo;
    
    onChange({
      ...data,
      name: basicInfo.name || '',
      residentNumber: basicInfo.residentNumber || '',
      gender: basicInfo.gender || '',
      phone: basicInfo.phone || '',
      personality: basicInfo.personality || '',
      workIntensity: basicInfo.workIntensity || '',
      height: basicInfo.height || '',
      weight: basicInfo.weight || '',
      bmi: basicInfo.bmi || '',
      occupation: basicInfo.occupation || '',
      patientId: basicInfo.patientId || ''
    });

    message.success(`${basicInfo.name}님의 기존 정보를 불러왔습니다.`);
  };

  // 자동완성 옵션 렌더링
  const renderPatientOptions = () => {
    return searchResults.map(patient => ({
      value: patient.basicInfo?.patientId,
      label: (
        <PatientOption>
          <div className="patient-info">
            <div className="patient-name">{patient.basicInfo?.name}</div>
            <div className="patient-details">
              {patient.basicInfo?.phone && `📞 ${patient.basicInfo.phone}`}
              {patient.basicInfo?.lastVisitDate && ` | 마지막 방문: ${new Date(patient.basicInfo.lastVisitDate).toLocaleDateString()}`}
            </div>
          </div>
          <div className="select-hint">선택하여 정보 불러오기</div>
        </PatientOption>
      )
    }));
  };

  const handleResidentNumberChange = (e) => {
    const input = e.target.value;
    const cleaned = input.replace(/[^\d-]/g, '');
    
    let formatted = cleaned;
    if (cleaned.length >= 6 && !cleaned.includes('-')) {
      formatted = `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`;
    }

    // 성별 자동 판단 (영문 코드로 저장)
    const gender = determineGender(formatted);
    console.log('🔍 성별 판단:', { formatted, gender });

    onChange({
      ...data,
      residentNumber: formatted,
      gender,
      patientId: formatted.length >= 7 ? `${formatted.slice(0, 6)}${formatted.charAt(7)}` : ''
    });

    // 주민번호 완성 시 기존 환자 검색
    if (formatted.length === 14) {
      handleResidentNumberSearch(formatted);
    }
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
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <StyledAutoComplete
                  value={data.name || ''}
                  onChange={(value) => handleInputChange('name', value)}
                  onSearch={handleNameSearch}
                  onSelect={handlePatientSelect}
                  placeholder="환자 이름 (기존 환자 검색 가능)"
                  options={renderPatientOptions()}
                  loading={searching}
                  allowClear
                  style={{ flex: 1 }}
                />
                <SearchButton
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleManualSearch}
                  loading={manualSearching}
                  title="환자 찾기"
                >
                  찾기
                </SearchButton>
              </div>
              <HelpText>
                이름을 입력하면 자동으로 검색되거나, "찾기" 버튼을 클릭하여 수동 검색할 수 있습니다
              </HelpText>
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem>
              <FieldLabel>주민등록번호</FieldLabel>
              <StyledTextInput
                value={data.residentNumber || ''}
                onChange={handleResidentNumberChange}
                placeholder="000000-0000000"
              />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem>
              <FieldLabel>성별</FieldLabel>
              <StyledSelect
                value={data.gender}
                onChange={(value) => handleInputChange('gender', value)}
                placeholder="주민번호 입력 시 자동 입력"
                disabled={!!data.residentNumber}
              >
                <Option value="male">남성</Option>
                <Option value="female">여성</Option>
              </StyledSelect>
              <HelpText>
                {data.gender ? GENDER_DISPLAY[data.gender] : '주민번호 입력 시 자동으로 설정됩니다'}
              </HelpText>
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

      {/* 환자 검색 결과 모달 */}
      <Modal
        title="환자 검색 결과"
        open={searchModalVisible}
        onCancel={() => {
          setSearchModalVisible(false);
          setManualSearchResults([]);
        }}
        footer={null}
        width={800}
      >
        {manualSearchResults.length > 0 ? (
          <div>
            <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
              검색 결과: {manualSearchResults.length}명의 환자를 찾았습니다.
            </Text>
            {manualSearchResults.map((patient, index) => (
              <SearchResultItem
                key={patient._id || index}
                onClick={() => handleManualPatientSelect(patient)}
              >
                <div className="patient-header">
                  <div className="patient-name">
                    <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    {patient.basicInfo?.name}
                  </div>
                  <div className="patient-id">
                    ID: {patient.basicInfo?.patientId}
                  </div>
                </div>
                <div className="patient-details">
                  {patient.basicInfo?.phone && (
                    <div className="detail-item">
                      <PhoneOutlined />
                      <span>{patient.basicInfo.phone}</span>
                    </div>
                  )}
                  {patient.basicInfo?.residentNumber && (
                    <div className="detail-item">
                      <IdcardOutlined />
                      <span>{patient.basicInfo.residentNumber}</span>
                    </div>
                  )}
                  {patient.basicInfo?.gender && (
                    <div className="detail-item">
                      <Tag color={patient.basicInfo.gender === 'male' ? 'blue' : 'pink'}>
                        {GENDER_DISPLAY[patient.basicInfo.gender]}
                      </Tag>
                    </div>
                  )}
                  {patient.basicInfo?.lastVisitDate && (
                    <div className="detail-item">
                      <span>마지막 방문: {new Date(patient.basicInfo.lastVisitDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </SearchResultItem>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="secondary">검색 결과가 없습니다.</Text>
            <br />
            <Text type="secondary">새로운 환자로 등록해주세요.</Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

BasicInfoSection.propTypes = {
  data: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default BasicInfoSection;