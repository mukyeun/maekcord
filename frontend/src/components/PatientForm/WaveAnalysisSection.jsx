import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Typography, message, Button, Card, Row, Col, Space } from 'antd';
import { PlayCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import waveIcon from '../../assets/icons/wave-analysis.svg';
import { calculatePVC, calculateBV, calculateSV } from './waveAnalysisUtils';
import {
  InputGroup,
  Label,
  StyledInput,
  ControlsContainer,
  ResultsContainer,
  WaveDataGrid
} from './styles';

const { Title, Text } = Typography;

// 혈관 탄성도 등급별 수치 매핑 수정 (A->0.2, E->1.0)
const ELASTICITY_SCORES = {
  'A': 0.2,
  'B': 0.4,
  'C': 0.6,
  'D': 0.8,
  'E': 1.0
};

// 유틸리티 함수들을 상단에 정의
const toNumber = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

/**
 * 엑셀 파일을 읽어서 2차원 배열로 변환
 */
const readExcelFile = async (file) => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('📑 엑셀 파일 읽기 완료:', {
      sheetName,
      rowCount: rows.length
    });

    return rows;
  } catch (error) {
    console.error('❌ 엑셀 파일 읽기 오류:', error);
    throw error;
  }
};

const StyledSelect = styled.select`
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: ${props => props.disabled ? '#f5f5f5' : 'white'};

  &:focus {
    border-color: #40a9ff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
`;

// 2행 8열 레이아웃을 위한 필드 구성
const FIRST_ROW_FIELDS = [
  { label: '수축기혈압', name: 'systolicBP', isManual: true, type: 'number' },
  { label: '이완기혈압', name: 'diastolicBP', isManual: true, type: 'number' },
  { label: '심박수', name: 'heartRate', isManual: true, type: 'number' },
  { label: '맥압', name: 'pulsePressure', isManual: false, type: 'number' },
  { label: 'a-b (ms)', name: 'a-b', isManual: true, type: 'number' },
  { label: 'a-c (ms)', name: 'a-c', isManual: true, type: 'number' },
  { label: 'a-d (ms)', name: 'a-d', isManual: true, type: 'number' },
  { label: 'a-e (ms)', name: 'a-e', isManual: true, type: 'number' }
];

const SECOND_ROW_FIELDS = [
  { label: 'b/a', name: 'b/a', isManual: true, type: 'number' },
  { label: 'c/a', name: 'c/a', isManual: true, type: 'number' },
  { label: 'd/a', name: 'd/a', isManual: true, type: 'number' },
  { label: 'e/a', name: 'e/a', isManual: true, type: 'number' },
  { label: '혈관의 탄성도', name: 'elasticityScore', isManual: false, type: 'number', precision: 1 },
  { label: '말초혈관 수축도 (PVC)', name: 'PVC', isManual: false, type: 'number', precision: 2 },
  { label: '혈관점탄도 (BV)', name: 'BV', isManual: false, type: 'number', precision: 2 },
  { label: '일회박출량 (SV)', name: 'SV', isManual: false, type: 'number', precision: 2 }
];

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

/**
 * 맥파 분석 컴포넌트
 */
const WaveAnalysisSection = ({ formData, onPulseWaveChange, fileProcessing = false }) => {
  const fileInputRef = useRef();
  const [isMeasuring, setIsMeasuring] = useState(false);

  // 유비오맥파기 실행 함수
  const handleUbioMeasurement = async () => {
    if (!formData.basicInfo?.name) {
      message.warning('환자 이름을 먼저 입력해주세요.');
      return;
    }

    setIsMeasuring(true);
    message.loading('유비오맥파기를 실행 중...', 0);

    try {
      // 백엔드 API를 통해 실제 유비오맥파기 실행
      const response = await fetch('/api/patients/execute-ubio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientName: formData.basicInfo.name,
          patientId: formData.basicInfo.patientId
        })
      });

      const result = await response.json();

      if (result.success) {
        message.destroy();
        message.success('유비오맥파기가 성공적으로 실행되었습니다. 측정을 완료한 후 데이터를 입력해주세요.');
        
        // 측정 완료 후 사용자에게 안내
        setTimeout(() => {
          message.info('측정이 완료되면 엑셀 데이터 가져오기 버튼을 사용하여 결과를 불러올 수 있습니다.');
        }, 2000);
      } else {
        message.destroy();
        message.error(result.message || '유비오맥파기 실행 중 오류가 발생했습니다.');
      }
      
    } catch (error) {
      console.error('유비오맥파기 실행 오류:', error);
      message.destroy();
      message.error('유비오맥파기 실행 중 오류가 발생했습니다. 프로그램이 설치되어 있는지 확인해주세요.');
    } finally {
      setIsMeasuring(false);
    }
  };

  // 자동 결과 가져오기 함수
  const handleFetchAutoResult = async () => {
    if (!formData.basicInfo?.name) {
      message.warning('결과를 가져올 환자 이름을 먼저 입력해주세요.');
      return;
    }

    message.loading('최근 측정 결과를 자동으로 가져오는 중...', 0);

    try {
      // 직접 read-ubio-result API 호출
      const response = await fetch('/api/patients/read-ubio-result', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          patientName: formData.basicInfo.name
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      message.destroy();

      if (result.success) {
        if (!result.pulseData || Object.keys(result.pulseData).length === 0) {
          message.warning('파일에서 유효한 측정 데이터를 찾을 수 없습니다.');
          return;
        }

        const newPulseWave = {
          ...formData.records?.pulseWave,
          ...result.pulseData,
          lastUpdated: result.pulseData.lastUpdated || new Date().toISOString()
        };

        // 자동 계산 값 추가
        newPulseWave.PVC = calculatePVC(newPulseWave);
        newPulseWave.BV = calculateBV(newPulseWave);
        newPulseWave.SV = calculateSV(newPulseWave);

        onPulseWaveChange({
          ...formData,
          records: {
            ...formData.records,
            pulseWave: newPulseWave
          }
        });

        const measurementTime = new Date(result.fileInfo?.lastModified || result.pulseData.lastUpdated).toLocaleString();
        message.success(`'${formData.basicInfo.name}'님의 ${measurementTime} 측정 데이터를 불러왔습니다.`);
      } else {
        message.error(result.message || '결과를 가져오는 데 실패했습니다.');
      }
    } catch (error) {
      message.destroy();
      console.error('자동 결과 가져오기 오류:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        message.error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        message.error('자동으로 결과를 가져오는 중 오류가 발생했습니다.');
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await readExcelFile(file);
      
      if (!result || result.length === 0) {
        message.error('엑셀 파일을 읽을 수 없습니다.');
        return;
      }

      const patientName = formData.basicInfo?.name;
      if (!patientName) {
        message.error('현재 편집 중인 환자의 이름 정보가 없어 엑셀 데이터를 매칭할 수 없습니다.');
        return;
      }

      console.log(`🔍 엑셀 파일에서 '${patientName}' 환자 검색 중...`);

      let rowData = null;
      let rowIndex = -1;

      // 파일의 마지막부터 역순으로 검색하여 해당 환자의 가장 최근 데이터를 찾습니다.
      for (let i = result.length - 1; i >= 0; i--) {
        const excelRowName = result[i][0]; // 이름이 A열(인덱스 0)에 있다고 가정
        if (excelRowName && typeof excelRowName === 'string' && excelRowName.trim() === patientName.trim()) {
          rowData = result[i];
          rowIndex = i;
          break;
        }
      }
      
      if (!rowData) {
        message.error(`엑셀 파일에서 '${patientName}' 환자의 데이터를 찾을 수 없습니다.`);
        return;
      }
      
      console.log(`✅ '${patientName}' 환자 데이터 발견 (엑셀 ${rowIndex + 1}번째 행)`);

      if (!rowData || rowData.length < 17) {
        message.error('선택된 환자의 데이터 형식이 올바르지 않거나, 데이터가 부족합니다.');
        return;
      }

      // 데이터 매핑 및 계산 로직
      const newPulseWave = {
        ...formData.records?.pulseWave,
        'elasticityScore': ELASTICITY_SCORES[rowData[8]] || '',
        'a-b': rowData[9] !== undefined ? parseFloat(rowData[9]) : '',
        'a-c': rowData[10] !== undefined ? parseFloat(rowData[10]) : '',
        'a-d': rowData[11] !== undefined ? parseFloat(rowData[11]) : '',
        'a-e': rowData[12] !== undefined ? parseFloat(rowData[12]) : '',
        'b/a': rowData[13] !== undefined ? parseFloat(rowData[13]) : '',
        'c/a': rowData[14] !== undefined ? parseFloat(rowData[14]) : '',
        'd/a': rowData[15] !== undefined ? parseFloat(rowData[15]) : '',
        'e/a': rowData[16] !== undefined ? parseFloat(rowData[16]) : '',
        lastUpdated: new Date().toISOString()
      };

      // 자동 계산 값 추가
      newPulseWave.PVC = calculatePVC(newPulseWave);
      newPulseWave.BV = calculateBV(newPulseWave);
      newPulseWave.SV = calculateSV(newPulseWave);

      onPulseWaveChange({
        ...formData,
        records: {
          ...formData.records,
          pulseWave: newPulseWave
        }
      });

      message.success(`'${patientName}' 환자의 최근 측정 데이터를 성공적으로 불러왔습니다.`);
    } catch (error) {
      console.error('파일 처리 중 오류 발생:', error);
      message.error('파일 처리 중 오류가 발생했습니다.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (name, value) => {
    const newValue = value === '' ? '' : Number(value);
    
    const newPulseWave = {
      ...formData.records?.pulseWave,
      [name]: newValue,
      lastUpdated: new Date().toISOString()
    };

    // 혈압이 변경될 때 맥압 자동 계산
    if (name === 'systolicBP' || name === 'diastolicBP') {
      const systolic = name === 'systolicBP' ? newValue : Number(newPulseWave.systolicBP);
      const diastolic = name === 'diastolicBP' ? newValue : Number(newPulseWave.diastolicBP);
      
      if (!isNaN(systolic) && !isNaN(diastolic)) {
        newPulseWave.pulsePressure = systolic - diastolic;
      }
    }

    onPulseWaveChange({
      ...formData,
      records: {
        ...formData.records,
        pulseWave: newPulseWave
      }
    });
  };

  return (
    <SectionCard>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        onClick={(e) => {
          e.currentTarget.value = '';
        }}
      />

      <ResultsContainer>
        <div className="section-header">
          <img src={waveIcon} alt="맥파" className="section-icon" />
          <Title level={4}>맥파 분석</Title>
        </div>

        <ControlsContainer>
          <Button 
            icon={<PlayCircleOutlined />} 
            onClick={handleUbioMeasurement}
            disabled={fileProcessing || isMeasuring}
            loading={isMeasuring}
            type="primary"
          >
            {isMeasuring ? '측정 중...' : '유비오맥파기 실행'}
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleFetchAutoResult} 
            disabled={fileProcessing || isMeasuring || !formData?.basicInfo?.name}
          >
            측정결과 불러오기
          </Button>
        </ControlsContainer>

        {formData?.records?.pulseWave?.lastUpdated && (
          <div style={{ color: '#888', marginBottom: '8px' }}>
            마지막 업데이트: {new Date(formData.records.pulseWave.lastUpdated).toLocaleString()}
          </div>
        )}

        <WaveDataGrid>
          {[...FIRST_ROW_FIELDS, ...SECOND_ROW_FIELDS].map(({ label, name, isManual, type, precision }) => (
            <InputGroup key={name}>
              <Label>{label}</Label>
              <StyledInput
                type={type}
                value={formData?.records?.pulseWave?.[name] ?? ''}
                onChange={(e) => handleInputChange(name, e.target.value)}
                readOnly={!isManual}
                disabled={fileProcessing && !isManual}
                placeholder={isManual ? '직접 입력' : '자동 계산'}
                step={precision ? Math.pow(0.1, precision) : 'any'}
              />
            </InputGroup>
          ))}
        </WaveDataGrid>
      </ResultsContainer>
    </SectionCard>
  );
};

WaveAnalysisSection.propTypes = {
  formData: PropTypes.object.isRequired,
  onPulseWaveChange: PropTypes.func.isRequired,
  fileProcessing: PropTypes.bool
};

export default WaveAnalysisSection;