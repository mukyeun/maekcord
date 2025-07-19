import React from 'react';
import { Modal, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const StyledModal = styled(Modal)`
  .ant-modal-header {
    border-radius: 16px 16px 0 0;
    background: transparent;
    border-bottom: none;
    padding: 0;
  }

  .ant-modal-body {
    background: #f5f7fa;
    border-radius: 0 0 16px 16px;
    padding: 16px;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
  }

  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }

  .ant-modal-close {
    display: none;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
  color: white;
  border-radius: 16px 16px 0 0;
  padding: 20px 24px;
  margin: -24px -24px 24px -24px;
  font-weight: 700;
  font-size: 24px;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CloseButton = styled(Button)`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.5);
  }
  
  .anticon {
    font-size: 18px;
  }
`;

const UnifiedModal = ({ 
  title, 
  icon: Icon, 
  children, 
  width = 800, 
  style = { top: 100 },
  onClose,
  ...props 
}) => {
  return (
    <StyledModal
      title={
        <ModalHeader>
          <HeaderContent>
            {Icon && <Icon style={{ fontSize: 32, marginRight: 8 }} />}
            {title}
          </HeaderContent>
          <CloseButton
            icon={<CloseOutlined />}
            onClick={onClose}
            type="text"
          />
        </ModalHeader>
      }
      width={width}
      style={style}
      footer={null}
      destroyOnHidden={true}
      maskClosable={true}
      keyboard={true}
      onCancel={onClose}
      {...props}
    >
      {children}
    </StyledModal>
  );
};

export default UnifiedModal; 