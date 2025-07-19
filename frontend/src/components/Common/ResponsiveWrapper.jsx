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

// 접근성 훅
export const useAccessibility = (options = {}) => {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQueryReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mediaQueryHighContrast = window.matchMedia('(prefers-contrast: high)');
    const mediaQueryDarkMode = window.matchMedia('(prefers-color-scheme: dark)');

    const handleReducedMotion = (e) => setIsReducedMotion(e.matches);
    const handleHighContrast = (e) => setIsHighContrast(e.matches);
    const handleDarkMode = (e) => setIsDarkMode(e.matches);

    setIsReducedMotion(mediaQueryReducedMotion.matches);
    setIsHighContrast(mediaQueryHighContrast.matches);
    setIsDarkMode(mediaQueryDarkMode.matches);

    mediaQueryReducedMotion.addEventListener('change', handleReducedMotion);
    mediaQueryHighContrast.addEventListener('change', handleHighContrast);
    mediaQueryDarkMode.addEventListener('change', handleDarkMode);

    return () => {
      mediaQueryReducedMotion.removeEventListener('change', handleReducedMotion);
      mediaQueryHighContrast.removeEventListener('change', handleHighContrast);
      mediaQueryDarkMode.removeEventListener('change', handleDarkMode);
    };
  }, []);

  return {
    isReducedMotion,
    isHighContrast,
    isDarkMode,
    accessibilityClass: `${isReducedMotion ? 'reduced-motion' : ''} ${isHighContrast ? 'high-contrast' : ''} ${isDarkMode ? 'dark-mode' : ''}`.trim()
  };
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
  responsive = true,
  className = '',
  style = {}
}) => {
  const breakpoint = useResponsive();
  
  const cols = responsive ? 
    (breakpoint.isMobile ? mobileCols : 
     breakpoint.isTablet ? tabletCols : 
     breakpoint.isLarge ? largeCols : desktopCols) : desktopCols;

  return (
    <Row 
      gutter={gutter} 
      className={`responsive-grid ${className}`}
      style={style}
    >
      {React.Children.map(children, (child, index) => (
        <Col
          key={index}
          xs={24 / mobileCols}
          sm={24 / tabletCols}
          md={24 / desktopCols}
          lg={24 / largeCols}
          xl={24 / largeCols}
          className="responsive-grid-item"
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
  fluid = false,
  className = '',
  style = {}
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
      className={`responsive-container ${className}`}
      style={{
        maxWidth: getMaxWidth(),
        margin: '0 auto',
        padding: getPadding(),
        width: '100%',
        boxSizing: 'border-box',
        ...style
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
  className = '',
  style = {},
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
      className={`responsive-text ${className}`}
      style={{ 
        fontSize: `${getFontSize()}px`,
        fontWeight: getFontWeight(),
        ...style
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
  className = '',
  style = {},
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
      className={`responsive-button ${className}`}
      size={getSize()}
      style={style}
      {...(getIconOnly() && { 'aria-label': children })}
      {...props}
    >
      {children}
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
  className = '',
  style = {},
  ...props 
}) => {
  const accessibility = useAccessibility();

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
      className={`accessibility-wrapper ${accessibility.accessibilityClass} ${className}`}
      style={style}
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
  className = '',
  style = {},
  ...props 
}) => {
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'Enter':
        onEnter?.(e);
        break;
      case ' ':
        e.preventDefault();
        onSpace?.(e);
        break;
      case 'Escape':
        onEscape?.(e);
        break;
      case 'ArrowUp':
        e.preventDefault();
        onArrowUp?.(e);
        break;
      case 'ArrowDown':
        e.preventDefault();
        onArrowDown?.(e);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onArrowLeft?.(e);
        break;
      case 'ArrowRight':
        e.preventDefault();
        onArrowRight?.(e);
        break;
      default:
        onKeyDown?.(e);
    }
  }, [onEnter, onSpace, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onKeyDown]);

  return (
    <div
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      className={`keyboard-navigation-wrapper ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

// 로딩 래퍼 (개선된 버전)
export const LoadingWrapper = ({ 
  children, 
  loading = false,
  loadingText = '로딩 중...',
  error = null,
  errorText = '오류가 발생했습니다.',
  retry = null,
  skeleton = false,
  skeletonCount = 3,
  className = '',
  style = {}
}) => {
  if (loading) {
    if (skeleton) {
      return (
        <div className={`loading-skeleton ${className}`} style={style}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <div key={index} className="skeleton-item" />
          ))}
        </div>
      );
    }
    return (
      <div className={`loading-wrapper ${className}`} style={style}>
        <div className="loading-spinner" />
        <div className="loading-text">{loadingText}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`error-wrapper ${className}`} style={style}>
        <div className="error-icon">⚠️</div>
        <div className="error-text">{errorText}</div>
        {retry && (
          <button onClick={retry} className="retry-button">
            다시 시도
          </button>
        )}
      </div>
    );
  }

  return <div className={className} style={style}>{children}</div>;
};

// 터치 제스처 래퍼 (개선된 버전)
export const TouchGestureWrapper = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  onSwipeUp, 
  onSwipeDown,
  threshold = 50,
  preventDefault = true,
  className = '',
  style = {},
  ...props 
}) => {
  const touchGestures = useTouchGestures(onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold);

  return (
    <div
      {...touchGestures}
      className={`touch-gesture-wrapper ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

// 모바일 최적화 컴포넌트 (개선된 버전)
export const MobileOptimized = ({ 
  children, 
  fallback = null,
  className = '',
  style = {},
  ...props 
}) => {
  const responsive = useResponsive();

  if (!responsive.isMobile) {
    return fallback || null;
  }

  return (
    <div className={`mobile-optimized ${className}`} style={style} {...props}>
      {children}
    </div>
  );
};

// 데스크톱 최적화 컴포넌트 (개선된 버전)
export const DesktopOptimized = ({ 
  children, 
  fallback = null,
  className = '',
  style = {},
  ...props 
}) => {
  const responsive = useResponsive();

  if (responsive.isMobile || responsive.isTablet) {
    return fallback || null;
  }

  return (
    <div className={`desktop-optimized ${className}`} style={style} {...props}>
      {children}
    </div>
  );
};

// 반응형 이미지 (개선된 버전)
export const ResponsiveImage = ({ 
  src, 
  alt, 
  mobileSrc,
  tabletSrc,
  desktopSrc,
  largeSrc,
  className = '',
  style = {},
  ...props 
}) => {
  const responsive = useResponsive();

  const getSrc = () => {
    if (responsive.isMobile && mobileSrc) return mobileSrc;
    if (responsive.isTablet && tabletSrc) return tabletSrc;
    if (responsive.isLarge && largeSrc) return largeSrc;
    if (responsive.isDesktop && desktopSrc) return desktopSrc;
    return src;
  };

  return (
    <img
      src={getSrc()}
      alt={alt}
      className={`responsive-image ${className}`}
      style={style}
      loading="lazy"
      {...props}
    />
  );
};

// 반응형 비디오 (새로 추가)
export const ResponsiveVideo = ({ 
  src, 
  mobileSrc,
  tabletSrc,
  desktopSrc,
  largeSrc,
  className = '',
  style = {},
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  ...props 
}) => {
  const responsive = useResponsive();

  const getSrc = () => {
    if (responsive.isMobile && mobileSrc) return mobileSrc;
    if (responsive.isTablet && tabletSrc) return tabletSrc;
    if (responsive.isLarge && largeSrc) return largeSrc;
    if (responsive.isDesktop && desktopSrc) return desktopSrc;
    return src;
  };

  return (
    <div className={`responsive-video-container ${className}`} style={style}>
      <video
        src={getSrc()}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        className="responsive-video"
        {...props}
      />
    </div>
  );
};

// 반응형 카드 (새로 추가)
export const ResponsiveCard = ({ 
  children, 
  mobileProps = {},
  tabletProps = {},
  desktopProps = {},
  largeProps = {},
  className = '',
  style = {},
  ...props 
}) => {
  const responsive = useResponsive();

  const getCardProps = () => {
    if (responsive.isMobile) return mobileProps;
    if (responsive.isTablet) return tabletProps;
    if (responsive.isLarge) return largeProps;
    return desktopProps;
  };

  return (
    <div
      className={`responsive-card ${className}`}
      style={style}
      {...getCardProps()}
      {...props}
    >
      {children}
    </div>
  );
};

// 반응형 네비게이션 (새로 추가)
export const ResponsiveNavigation = ({ 
  children, 
  mobileMenu = null,
  tabletMenu = null,
  desktopMenu = null,
  className = '',
  style = {},
  ...props 
}) => {
  const responsive = useResponsive();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getMenu = () => {
    if (responsive.isMobile) return mobileMenu;
    if (responsive.isTablet) return tabletMenu;
    return desktopMenu;
  };

  return (
    <nav className={`responsive-navigation ${className}`} style={style} {...props}>
      {responsive.isMobile && mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
      {getMenu() || children}
    </nav>
  );
};

// 반응형 폼 (새로 추가)
export const ResponsiveForm = ({ 
  children, 
  mobileLayout = 'stack',
  tabletLayout = 'grid',
  desktopLayout = 'grid',
  className = '',
  style = {},
  ...props 
}) => {
  const responsive = useResponsive();

  const getLayout = () => {
    if (responsive.isMobile) return mobileLayout;
    if (responsive.isTablet) return tabletLayout;
    return desktopLayout;
  };

  return (
    <form
      className={`responsive-form responsive-form-${getLayout()} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </form>
  );
};

// 반응형 테이블 (새로 추가)
export const ResponsiveTable = ({ 
  children, 
  mobileScroll = true,
  tabletScroll = false,
  desktopScroll = false,
  className = '',
  style = {},
  ...props 
}) => {
  const responsive = useResponsive();

  const getScrollClass = () => {
    if (responsive.isMobile && mobileScroll) return 'mobile-scroll';
    if (responsive.isTablet && tabletScroll) return 'tablet-scroll';
    if (responsive.isDesktop && desktopScroll) return 'desktop-scroll';
    return '';
  };

  return (
    <div
      className={`responsive-table ${getScrollClass()} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

// 성능 최적화 래퍼 (새로 추가)
export const PerformanceOptimized = ({ 
  children, 
  shouldOptimize = true,
  className = '',
  style = {},
  ...props 
}) => {
  if (!shouldOptimize) {
    return <div className={className} style={style} {...props}>{children}</div>;
  }

  return (
    <div
      className={`performance-optimized ${className}`}
      style={{
        willChange: 'transform',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// 스크롤 최적화 래퍼 (새로 추가)
export const ScrollOptimized = ({ 
  children, 
  smooth = true,
  touch = true,
  overscroll = true,
  className = '',
  style = {},
  ...props 
}) => {
  return (
    <div
      className={`scroll-optimized ${className}`}
      style={{
        scrollBehavior: smooth ? 'smooth' : 'auto',
        WebkitOverflowScrolling: touch ? 'touch' : 'auto',
        overscrollBehavior: overscroll ? 'contain' : 'auto',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// 터치 최적화 래퍼 (새로 추가)
export const TouchOptimized = ({ 
  children, 
  manipulation = true,
  highlight = false,
  select = false,
  className = '',
  style = {},
  ...props 
}) => {
  return (
    <div
      className={`touch-optimized ${className}`}
      style={{
        touchAction: manipulation ? 'manipulation' : 'auto',
        WebkitTapHighlightColor: highlight ? 'transparent' : 'auto',
        WebkitUserSelect: select ? 'none' : 'auto',
        userSelect: select ? 'none' : 'auto',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// 포커스 최적화 래퍼 (새로 추가)
export const FocusOptimized = ({ 
  children, 
  outline = true,
  offset = 2,
  radius = 4,
  className = '',
  style = {},
  ...props 
}) => {
  return (
    <div
      className={`focus-optimized ${className}`}
      style={{
        outline: outline ? 'none' : 'auto',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default ResponsiveWrapper; 