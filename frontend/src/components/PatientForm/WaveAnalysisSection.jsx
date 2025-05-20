import React, { useRef } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Typography, message, Button, Card } from 'antd';
import { PlayCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import waveIcon from '../../assets/icons/wave-analysis.svg';
import { calculatePVC, calculateBV, calculateSV } from './waveAnalysisUtils';
import {
  GridContainer,
  InputGroup,
  Label,
  StyledInput,
  ControlsContainer,
  ResultsContainer,
  WaveDataGrid
} from './styles';

const { Title } = Typography;

const ELASTICITY_SCORES = {
  A: 0.2,
  B: 0.4,
  C: 0.6,
  D: 0.8,
  E: 1.0
};

const safeParse = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? '' : num;
};

const FIRST_ROW_FIELDS = [
  { label: '수축기혈압', name: 'systolicBP', isManual: true },
  { label: '이완기혈압', name: 'diastolicBP', isManual: true },
  { label: '심박수', name: 'heartRate', isManual: true },
  { label: '맥압', name: 'pulsePressure', isManual: false },
  { label: 'a-b (ms)', name: 'a-b', isManual: true },
  { label: 'a-c (ms)', name: 'a-c', isManual: true },
  { label: 'a-d (ms)', name: 'a-d', isManual: true },
  { label: 'a-e (ms)', name: 'a-e', isManual: true }
];

const SECOND_ROW_FIELDS = [
  { label: 'b/a', name: 'b/a', isManual: true },
  { label: 'c/a', name: 'c/a', isManual: true },
  { label: 'd/a', name: 'd/a', isManual: true },
  { label: 'e/a', name: 'e/a', isManual: true },
  { label: '혈관 탄성도', name: 'elasticityScore', isManual: false },
  { label: 'PVC', name: 'PVC', isManual: false },
  { label: 'BV', name: 'BV', isManual: false },
  { label: 'SV', name: 'SV', isManual: false }
];

const WaveAnalysisSection = ({ formData, onPulseWaveChange }) => {
  const fileInputRef = useRef();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const latest = rows[rows.length - 1];
      if (!latest || latest.length < 17) {
        message.error('엑셀 데이터가 부족합니다.');
        return;
      }

      const newPulseWave = {
        ...(formData.records?.pulseWave || {}),
        'a-b': safeParse(latest[9]),
        'a-c': safeParse(latest[10]),
        'a-d': safeParse(latest[11]),
        'a-e': safeParse(latest[12]),
        'b/a': safeParse(latest[13]),
        'c/a': safeParse(latest[14]),
        'd/a': safeParse(latest[15]),
        'e/a': safeParse(latest[16]),
        'elasticityScore': ELASTICITY_SCORES[String(latest[8]).trim().toUpperCase()] || '',
      };

      // 계산
      newPulseWave.PVC = calculatePVC(newPulseWave);
      newPulseWave.BV = calculateBV(newPulseWave);
      newPulseWave.SV = calculateSV(newPulseWave);

      // 적용
      onPulseWaveChange({
        ...formData,
        records: {
          ...formData.records,
          pulseWave: {
            ...formData.records?.pulseWave,
            ...newPulseWave,
            lastUpdated: new Date().toISOString()
          }
        }
      });

      message.success('엑셀 데이터를 불러왔습니다.');
    } catch (error) {
      console.error('엑셀 처리 오류:', error);
      message.error('엑셀 파일 처리 중 오류 발생');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (name, value) => {
    const numValue = value === '' ? '' : Number(value);
    const updated = {
      ...formData.records?.pulseWave,
      [name]: numValue
    };

    if (name === 'systolicBP' || name === 'diastolicBP') {
      const sys = name === 'systolicBP' ? numValue : Number(updated.systolicBP);
      const dia = name === 'diastolicBP' ? numValue : Number(updated.diastolicBP);
      if (!isNaN(sys) && !isNaN(dia)) {
        updated.pulsePressure = sys - dia;
      }
    }

    onPulseWaveChange({
      ...formData,
      records: {
        ...formData.records,
        pulseWave: {
          ...updated,
          lastUpdated: new Date().toISOString()
        }
      }
    });
  };

  return (
    <Card>
      <input
        type="file"
        accept=".xlsx,.xls"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      <ResultsContainer>
        <div className="section-header">
          <img src={waveIcon} alt="맥파" className="section-icon" />
          <Title level={4}>맥파 분석</Title>
        </div>

        <ControlsContainer>
          <Button icon={<PlayCircleOutlined />} onClick={() => message.info('맥파기 실행 준비 중')}>
            유비오맥파기 실행
          </Button>
          <Button icon={<DownloadOutlined />} onClick={() => fileInputRef.current?.click()}>
            엑셀 데이터 가져오기
          </Button>
        </ControlsContainer>

        {formData?.records?.pulseWave?.lastUpdated && (
          <div style={{ color: '#888', marginBottom: 8 }}>
            마지막 업데이트: {new Date(formData.records.pulseWave.lastUpdated).toLocaleString()}
          </div>
        )}

        <WaveDataGrid>
          {[...FIRST_ROW_FIELDS, ...SECOND_ROW_FIELDS].map(({ label, name, isManual }) => (
            <InputGroup key={name}>
              <Label>{label}</Label>
              <StyledInput
                type="number"
                value={formData?.records?.pulseWave?.[name] ?? ''}
                onChange={(e) => handleInputChange(name, e.target.value)}
                readOnly={!isManual}
                placeholder={isManual ? '직접 입력' : '자동 계산'}
              />
            </InputGroup>
          ))}
        </WaveDataGrid>
      </ResultsContainer>
    </Card>
  );
};

WaveAnalysisSection.propTypes = {
  formData: PropTypes.object.isRequired,
  onPulseWaveChange: PropTypes.func.isRequired
};

export default WaveAnalysisSection;
