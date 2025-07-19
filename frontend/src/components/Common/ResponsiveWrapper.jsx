import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Row, Col } from 'antd';

// 성능 최적화된 반응형 훅
export const useResponsive = (breakpoints = {
  mobile: { maxWidth: 767 },
  tablet: { minWidth: 768, maxWidth: 1023 },
  desktop: { minWidth: 1024 },
  large: { minWidth: 1440 }
}) => {
  const isMobile = useMediaQuery(breakpoints.mobile);
  const isTablet = useMediaQuery(breakpoints.tablet);
  const isDesktop = useMediaQuery(breakpoints.desktop);
  const isLarge = useMediaQuery(breakpoints.large);

  return useMemo(() => ({
    isMobile,
    isTablet,
    isDesktop,
    isLarge,
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop,
    isDesktopOrLarge: isDesktop || isLarge,
    currentBreakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : isLarge ? 'large' : 'desktop'
  }), [isMobile, isTablet, isDesktop, isLarge]);
};

// 터치 제스처 지원 훅
export const useTouchGestures = (onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50) => {
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });

  const onTouchStart = useCallback((e) => {
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const onTouchMove = useCallback((e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      if (distanceX > threshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (distanceX < -threshold && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      if (distanceY > threshold && onSwipeUp) {
        onSwipeUp();
      } else if (distanceY < -threshold && onSwipeDown) {
        onSwipeDown();
      }
    }
  }, [touchStart, touchEnd, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return { onTouchStart, onTouchMove, onTouchEnd };
};

const ResponsiveWrapper = ({ 
  children, 
  mobileProps = {}, 
  tabletProps = {}, 
  desktopProps = {},
  largeProps = {},
  breakpoints = {
    mobile: { maxWidth: 767 },
    tablet: { minWidth: 768, maxWidth: 1023 },
    desktop: { minWidth: 1024, maxWidth: 1439 },
    large: { minWidth: 1440 }
  }
}) => {
  const responsive = useResponsive(breakpoints);

  const getResponsiveProps = useMemo(() => {
    if (responsive.isMobile) return mobileProps;
    if (responsive.isTablet) return tabletProps;
    if (responsive.isLarge) return largeProps;
    return desktopProps;
  }, [responsive, mobileProps, tabletProps, desktopProps, largeProps]);

  return (
    <div {...getResponsiveProps}>
      {children}
    </div>
  );
};

// 반응형 그리드 컴포넌트 (개선된 버전)
export const ResponsiveGrid = ({ 
  children, 
  gutter = [16, 16],
  mobileCols = 1,
  tabletCols = 2,
  desktopCols = 3,
  largeCols = 4,
  responsive = true
}) => {
  const breakpoint = useResponsive();
  
  const cols = responsive ? 
    (breakpoint.isMobile ? mobileCols : 
     breakpoint.isTablet ? tabletCols : 
     breakpoint.isLarge ? largeCols : desktopCols) : desktopCols;

  return (
    <Row gutter={gutter}>
      {React.Children.map(children, (child, index) => (
        <Col
          key={index}
          xs={24 / mobileCols}
          sm={24 / tabletCols}
          md={24 / desktopCols}
          lg={24 / largeCols}
          xl={24 / largeCols}
        >
          {child}
        </Col>
      ))}
    </Row>
  );
};

// 반응형 컨테이너 (개선된 버전)
export const ResponsiveContainer = ({ 
  children, 
  maxWidth = '1200px',
  padding = '16px',
  mobilePadding = '8px',
  tabletPadding = '12px',
  largePadding = '24px',
  fluid = false
}) => {
  const responsive = useResponsive();

  const getPadding = () => {
    if (responsive.isMobile) return mobilePadding;
    if (responsive.isTablet) return tabletPadding;
    if (responsive.isLarge) return largePadding;
    return padding;
  };

  const getMaxWidth = () => {
    if (fluid) return '100%';
    if (responsive.isMobile) return '100%';
    if (responsive.isTablet) return '100%';
    return maxWidth;
  };

  return (
    <div
      style={{
        maxWidth: getMaxWidth(),
        margin: '0 auto',
        padding: getPadding(),
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {children}
    </div>
  );
};

// 반응형 텍스트 (개선된 버전)
export const ResponsiveText = ({ 
  children, 
  mobileSize = 14,
  tabletSize = 16,
  desktopSize = 18,
  largeSize = 20,
  mobileWeight = 400,
  tabletWeight = 400,
  desktopWeight = 500,
  largeWeight = 500,
  ...props 
}) => {
  const responsive = useResponsive();

  const getFontSize = () => {
    if (responsive.isMobile) return mobileSize;
    if (responsive.isTablet) return tabletSize;
    if (responsive.isLarge) return largeSize;
    return desktopSize;
  };

  const getFontWeight = () => {
    if (responsive.isMobile) return mobileWeight;
    if (responsive.isTablet) return tabletWeight;
    if (responsive.isLarge) return largeWeight;
    return desktopWeight;
  };

  return (
    <span 
      style={{ 
        fontSize: `${getFontSize()}px`,
        fontWeight: getFontWeight()
      }} 
      {...props}
    >
      {children}
    </span>
  );
};

// 반응형 버튼 (개선된 버전)
export const ResponsiveButton = ({ 
  children, 
  mobileSize = 'small',
  tabletSize = 'middle',
  desktopSize = 'large',
  mobileIcon = false,
  tabletIcon = false,
  desktopIcon = true,
  largeIcon = true,
  ...props 
}) => {
  const responsive = useResponsive();

  const getSize = () => {
    if (responsive.isMobile) return mobileSize;
    if (responsive.isTablet) return tabletSize;
    return desktopSize;
  };

  const getIconOnly = () => {
    if (responsive.isMobile) return mobileIcon;
    if (responsive.isTablet) return tabletIcon;
    if (responsive.isLarge) return largeIcon;
    return desktopIcon;
  };

  return (
    <button 
      size={getSize()}
      {...(getIconOnly() && { 'aria-label': children })}
      {...props}
    >
      {getIconOnly() ? null : children}
    </button>
  );
};

// 접근성 래퍼 (개선된 버전)
export const AccessibilityWrapper = ({ 
  children, 
  role,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  'aria-live': ariaLive,
  'aria-expanded': ariaExpanded,
  'aria-hidden': ariaHidden,
  tabIndex,
  onFocus,
  onBlur,
  ...props 
}) => {
  return (
    <div
      role={role}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-live={ariaLive}
      aria-expanded={ariaExpanded}
      aria-hidden={ariaHidden}
      tabIndex={tabIndex}
      onFocus={onFocus}
      onBlur={onBlur}
      {...props}
    >
      {children}
    </div>
  );
};

// 키보드 네비게이션 래퍼 (개선된 버전)
export const KeyboardNavigationWrapper = ({ 
  children, 
  onKeyDown,
  tabIndex = 0,
  onEnter,
  onSpace,
  onEscape,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  ...props 
}) => {
  const handleKeyDown = useCallback((event) => {
    if (onKeyDown) {
      onKeyDown(event);
    }

    switch (event.key) {
      case 'Enter':
        if (onEnter) {
          event.preventDefault();
          onEnter(event);
        } else if (event.target.onClick) {
          event.target.onClick();
        }
        break;
      case ' ':
        if (onSpace) {
          event.preventDefault();
          onSpace(event);
        } else if (event.target.onClick) {
          event.preventDefault();
          event.target.onClick();
        }
        break;
      case 'Escape':
        if (onEscape) {
          event.preventDefault();
          onEscape(event);
        }
        break;
      case 'ArrowUp':
        if (onArrowUp) {
          event.preventDefault();
          onArrowUp(event);
        }
        break;
      case 'ArrowDown':
        if (onArrowDown) {
          event.preventDefault();
          onArrowDown(event);
        }
        break;
      case 'ArrowLeft':
        if (onArrowLeft) {
          event.preventDefault();
          onArrowLeft(event);
        }
        break;
      case 'ArrowRight':
        if (onArrowRight) {
          event.preventDefault();
          onArrowRight(event);
        }
        break;
    }
  }, [onKeyDown, onEnter, onSpace, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]);

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

// 로딩 상태 래퍼 (개선된 버전)
export const LoadingWrapper = ({ 
  children, 
  loading = false,
  loadingText = '로딩 중...',
  error = null,
  errorText = '오류가 발생했습니다.',
  retry = null,
  skeleton = false,
  skeletonCount = 3
}) => {
  const responsive = useResponsive();

  if (loading) {
    if (skeleton) {
      return (
        <div style={{ padding: responsive.isMobile ? '16px' : '24px' }}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <div
              key={index}
              style={{
                height: '20px',
                background: '#f0f0f0',
                marginBottom: '8px',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: responsive.isMobile ? '32px' : '40px',
        flexDirection: 'column'
      }}>
        <div className="loading-spinner"></div>
        <p style={{ 
          marginTop: '16px', 
          color: '#666',
          fontSize: responsive.isMobile ? '14px' : '16px'
        }}>
          {loadingText}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: responsive.isMobile ? '32px' : '40px',
        flexDirection: 'column'
      }}>
        <p style={{ 
          color: '#ff4d4f', 
          marginBottom: '16px',
          fontSize: responsive.isMobile ? '14px' : '16px',
          textAlign: 'center'
        }}>
          {errorText}
        </p>
        {retry && (
          <button 
            onClick={retry} 
            style={{ 
              padding: responsive.isMobile ? '8px 12px' : '8px 16px',
              fontSize: responsive.isMobile ? '14px' : '16px'
            }}
          >
            다시 시도
          </button>
        )}
      </div>
    );
  }

  return children;
};

// 터치 제스처 래퍼
export const TouchGestureWrapper = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  onSwipeUp, 
  onSwipeDown,
  threshold = 50,
  preventDefault = true,
  ...props 
}) => {
  const touchHandlers = useTouchGestures(
    onSwipeLeft, 
    onSwipeRight, 
    onSwipeUp, 
    onSwipeDown, 
    threshold
  );

  return (
    <div
      {...touchHandlers}
      style={{ 
        touchAction: preventDefault ? 'none' : 'auto',
        ...props.style 
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// 모바일 최적화 컴포넌트
export const MobileOptimized = ({ 
  children, 
  fallback = null,
  ...props 
}) => {
  const responsive = useResponsive();
  
  if (!responsive.isMobile) {
    return fallback || children;
  }
  
  return (
    <div {...props}>
      {children}
    </div>
  );
};

// 데스크톱 최적화 컴포넌트
export const DesktopOptimized = ({ 
  children, 
  fallback = null,
  ...props 
}) => {
  const responsive = useResponsive();
  
  if (responsive.isMobile || responsive.isTablet) {
    return fallback || children;
  }
  
  return (
    <div {...props}>
      {children}
    </div>
  );
};

// 반응형 이미지 컴포넌트
export const ResponsiveImage = ({ 
  src, 
  alt, 
  mobileSrc,
  tabletSrc,
  desktopSrc,
  largeSrc,
  ...props 
}) => {
  const responsive = useResponsive();
  
  const getSrc = () => {
    if (mobileSrc && responsive.isMobile) return mobileSrc;
    if (tabletSrc && responsive.isTablet) return tabletSrc;
    if (largeSrc && responsive.isLarge) return largeSrc;
    if (desktopSrc && responsive.isDesktop) return desktopSrc;
    return src;
  };

  return (
    <img 
      src={getSrc()} 
      alt={alt}
      style={{
        maxWidth: '100%',
        height: 'auto',
        ...props.style
      }}
      {...props}
    />
  );
};

export default ResponsiveWrapper; 