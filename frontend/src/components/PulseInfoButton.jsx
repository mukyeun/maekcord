import React, { useState } from 'react';
import PulseInfoModal from './PulseInfoModal';
import './PulseInfoButton.css';

const PulseInfoButton = ({ pulseType, children, className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <button 
        className={`pulse-info-button ${className}`}
        onClick={handleClick}
        title={`${pulseType} 맥상 정보 보기`}
      >
        {children || '맥상정보보기'}
      </button>
      
      <PulseInfoModal 
        isOpen={isModalOpen}
        onClose={handleClose}
        pulseType={pulseType}
      />
    </>
  );
};

export default PulseInfoButton; 