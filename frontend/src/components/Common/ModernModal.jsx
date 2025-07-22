import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';

// 애니메이션 정의
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
`;

const backdropFadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

// 스타일드 컴포넌트
const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${backdropFadeIn} 0.3s ease-out;
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 10px;
    align-items: flex-end;
  }
`;

const ModalContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  max-width: ${props => props.width || '600px'};
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  animation: ${fadeIn} 0.3s ease-out;
  position: relative;
  
  @media (max-width: 768px) {
    border-radius: 20px 20px 0 0;
    max-height: 95vh;
    animation: ${slideIn} 0.3s ease-out;
  }
`;

const ModalHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
    border-radius: 24px 24px 0 0;
  }
  
  @media (max-width: 768px) {
    padding: 20px 24px;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
`;

const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
  
  &:focus {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: 2px;
  }
  
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
  }
`;

const ModalContent = styled.div`
  padding: 32px;
  overflow-y: auto;
  max-height: calc(90vh - 120px);
  
  @media (max-width: 768px) {
    padding: 24px;
    max-height: calc(95vh - 100px);
  }
  
  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
    
    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
`;

const MobileHandle = styled.div`
  display: none;
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin: 0 auto 16px;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const ModernModal = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  width = '600px',
  showBackButton = false,
  onBack,
  ...props
}) => {
  const modalRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <ModalBackdrop
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <ModalContainer
        ref={modalRef}
        width={width}
        tabIndex={-1}
        {...props}
      >
        <ModalHeader>
          <MobileHandle />
          <HeaderContent>
            {showBackButton && (
              <CloseButton
                onClick={onBack}
                aria-label="뒤로 가기"
                style={{ marginRight: 8 }}
              >
                <ArrowLeftOutlined />
              </CloseButton>
            )}
            {Icon && <Icon style={{ fontSize: 24 }} />}
            <HeaderTitle id="modal-title">{title}</HeaderTitle>
          </HeaderContent>
          <CloseButton
            onClick={onClose}
            aria-label="닫기"
          >
            <CloseOutlined />
          </CloseButton>
        </ModalHeader>
        <ModalContent>
          {children}
        </ModalContent>
      </ModalContainer>
    </ModalBackdrop>,
    document.body
  );
};

export default ModernModal; 