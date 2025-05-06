import styled from 'styled-components';
import { Card } from 'antd';

export const DoctorViewContainer = styled.div`
  padding: 20px;
  background: #f0f2f5;
  min-height: 70vh;

  .ant-tabs-content {
    background: white;
    padding: 24px;
    border-radius: 8px;
  }
`;

export const PatientInfoSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

export const AnalysisSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

export const PulseSection = styled.div`
  margin-bottom: 24px;
`;

export const RecommendationSection = styled.div`
  margin-bottom: 24px;
`;

export const ConsultationSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

export const TreatmentSection = styled.div`
  margin-bottom: 24px;
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  
  > div {
    padding: 8px;
    background: #fafafa;
    border-radius: 4px;
    font-size: 14px;
  }
`;

export const StyledCard = styled(Card)`
  height: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;

  .ant-card-head {
    background: #fafafa;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  .ant-card-head-title {
    font-size: 16px;
    font-weight: 600;
    color: #1890ff;
  }

  .ant-card-body {
    padding: 16px;
  }
`;

export const ChartContainer = styled.div`
  height: 300px;
  margin: 20px 0;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

export const GaugeContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  margin: 20px 0;
`;

export const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0;

  .ant-tag {
    margin: 0;
    padding: 4px 8px;
    font-size: 12px;
  }
`;

export const MeasurementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin: 16px 0;

  .measurement-item {
    padding: 12px;
    background: #f5f5f5;
    border-radius: 6px;
    text-align: center;

    .label {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    .value {
      font-size: 16px;
      font-weight: 600;
      color: #1890ff;
    }
  }
`;

export const RecommendationCard = styled(Card)`
  margin-bottom: 16px;

  .match-rate {
    font-size: 18px;
    font-weight: 600;
    color: #1890ff;
    margin-bottom: 8px;
  }

  .symptoms, .organs {
    margin: 8px 0;
    
    .label {
      font-weight: 500;
      margin-right: 8px;
      color: #666;
    }
  }
`;

export const ConsultationForm = styled.div`
  .ant-form-item {
    margin-bottom: 16px;
  }

  .ant-checkbox-wrapper {
    margin: 8px 0;
    display: block;
  }

  .ant-picker {
    width: 100%;
  }
`; 