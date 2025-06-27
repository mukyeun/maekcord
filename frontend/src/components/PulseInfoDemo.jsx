import React, { useState } from 'react';
import PulseInfoButton from './PulseInfoButton';
import PulseInfoModal from './PulseInfoModal';
import './PulseInfoDemo.css';

const PulseInfoDemo = ({ patientPulseData }) => {
  const [selectedPulse, setSelectedPulse] = useState('부허맥');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pulseTypes = [
    '부허맥',
    '부삽허맥',
    '부삽허지맥',
    '부활맥',
    '부삽맥'
  ];

  const handlePulseSelect = (pulseType) => {
    setSelectedPulse(pulseType);
  };

  const handleShowInfo = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="pulse-info-demo">
      <div className="demo-header">
        <h2>맥상 정보 시스템 데모</h2>
        <p>팔요맥 분류 결과에 따른 맥상 정보 제공 시스템</p>
      </div>

      <div className="demo-content">
        <div className="pulse-selection">
          <h3>맥상 선택</h3>
          <div className="pulse-buttons">
            {pulseTypes.map((pulseType) => (
              <button
                key={pulseType}
                className={`pulse-select-btn ${selectedPulse === pulseType ? 'active' : ''}`}
                onClick={() => handlePulseSelect(pulseType)}
              >
                {pulseType}
              </button>
            ))}
          </div>
        </div>

        <div className="selected-pulse-info">
          <h3>선택된 맥상: {selectedPulse}</h3>
          <p>팔요맥 분류 결과가 <strong>{selectedPulse}</strong>로 결정되었습니다.</p>
          
          <div className="action-buttons">
            <PulseInfoButton 
              pulseType={selectedPulse}
              patientPulseData={patientPulseData}
              className="large"
            >
              맥상정보보기
            </PulseInfoButton>
            
            <button 
              className="demo-btn secondary"
              onClick={handleShowInfo}
            >
              모달 직접 열기
            </button>
          </div>
        </div>

        <div className="demo-features">
          <h3>시스템 기능</h3>
          <div className="features-grid">
            <div className="feature-card">
              <h4>📊 상세 정보 제공</h4>
              <p>맥상의 생리학적 특성, 발생 원인, 영향, 관련 질환 등 상세 정보를 제공합니다.</p>
            </div>
            <div className="feature-card">
              <h4>🏥 전신 영향 분석</h4>
              <p>각 신체 시스템별로 맥상이 미치는 영향을 체계적으로 분석하여 제공합니다.</p>
            </div>
            <div className="feature-card">
              <h4>💊 관리 방법 제시</h4>
              <p>맥상에 따른 적절한 관리 방법과 주의사항을 제시합니다.</p>
            </div>
            <div className="feature-card">
              <h4>🔍 검색 기능</h4>
              <p>맥상 타입, 한자, 설명 등을 통해 원하는 맥상 정보를 검색할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 직접 모달 열기 예시 */}
      <PulseInfoModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        pulseType={selectedPulse}
        patientPulseData={patientPulseData}
      />
    </div>
  );
};

export default PulseInfoDemo; 