import React from 'react';
import { useMediaQuery } from 'react-responsive';
import { Row, Col } from 'antd';

const ResponsiveWrapper = ({ 
  children, 
  mobileProps = {}, 
  tabletProps = {}, 
  desktopProps = {},
  breakpoints = {
    mobile: { maxWidth: 767 },
    tablet: { minWidth: 768, maxWidth: 1023 },
    desktop: { minWidth: 1024 }
  }
}) => {
  const isMobile = useMediaQuery(breakpoints.mobile);
  const isTablet = useMediaQuery(breakpoints.tablet);
  const isDesktop = useMediaQuery(breakpoints.desktop);

  const getResponsiveProps = () => {
    if (isMobile) return mobileProps;
    if (isTablet) return tabletProps;
    if (isDesktop) return desktopProps;
    return desktopProps; // 기본값
  };

  const responsiveProps = getResponsiveProps();

  return (
    <div {...responsiveProps}>
      {children}
    </div>
  );
};

// 반응형 그리드 컴포넌트
export const ResponsiveGrid = ({ 
  children, 
  gutter = [16, 16],
  mobileCols = 1,
  tabletCols = 2,
  desktopCols = 3
}) => {
  return (
    <Row gutter={gutter}>
      {React.Children.map(children, (child, index) => (
        <Col
          key={index}
          xs={24 / mobileCols}
          sm={24 / tabletCols}
          md={24 / tabletCols}
          lg={24 / desktopCols}
          xl={24 / desktopCols}
        >
          {child}
        </Col>
      ))}
    </Row>
  );
};

// 반응형 컨테이너
export const ResponsiveContainer = ({ 
  children, 
  maxWidth = '1200px',
  padding = '16px',
  mobilePadding = '8px'
}) => {
  const isMobile = useMediaQuery({ maxWidth: 767 });

  return (
    <div
      style={{
        maxWidth,
        margin: '0 auto',
        padding: isMobile ? mobilePadding : padding,
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {children}
    </div>
  );
};

// 반응형 텍스트
export const ResponsiveText = ({ 
  children, 
  mobileSize = 14,
  tabletSize = 16,
  desktopSize = 18,
  ...props 
}) => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

  const fontSize = isMobile ? mobileSize : isTablet ? tabletSize : desktopSize;

  return (
    <span style={{ fontSize: `${fontSize}px` }} {...props}>
      {children}
    </span>
  );
};

// 반응형 버튼
export const ResponsiveButton = ({ 
  children, 
  mobileSize = 'small',
  tabletSize = 'middle',
  desktopSize = 'large',
  ...props 
}) => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

  const size = isMobile ? mobileSize : isTablet ? tabletSize : desktopSize;

  return (
    <button size={size} {...props}>
      {children}
    </button>
  );
};

// 접근성 래퍼
export const AccessibilityWrapper = ({ 
  children, 
  role,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  tabIndex,
  ...props 
}) => {
  return (
    <div
      role={role}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      tabIndex={tabIndex}
      {...props}
    >
      {children}
    </div>
  );
};

// 키보드 네비게이션 래퍼
export const KeyboardNavigationWrapper = ({ 
  children, 
  onKeyDown,
  tabIndex = 0,
  ...props 
}) => {
  const handleKeyDown = (event) => {
    if (onKeyDown) {
      onKeyDown(event);
    }

    // Enter 키 처리
    if (event.key === 'Enter' && event.target.onClick) {
      event.target.onClick();
    }

    // Space 키 처리
    if (event.key === ' ' && event.target.onClick) {
      event.preventDefault();
      event.target.onClick();
    }
  };

  return (
    <div
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      style={{ outline: 'none' }}
      {...props}
    >
      {children}
    </div>
  );
};

// 로딩 상태 래퍼
export const LoadingWrapper = ({ 
  children, 
  loading = false,
  loadingText = '로딩 중...',
  error = null,
  errorText = '오류가 발생했습니다.',
  retry = null
}) => {
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '40px',
        flexDirection: 'column'
      }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '16px', color: '#666' }}>{loadingText}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '40px',
        flexDirection: 'column'
      }}>
        <p style={{ color: '#ff4d4f', marginBottom: '16px' }}>{errorText}</p>
        {retry && (
          <button onClick={retry} style={{ padding: '8px 16px' }}>
            다시 시도
          </button>
        )}
      </div>
    );
  }

  return children;
};

export default ResponsiveWrapper; 