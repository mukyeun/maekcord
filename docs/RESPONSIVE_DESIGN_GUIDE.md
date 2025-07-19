# 반응형 디자인 개선 가이드

## 개요

이 문서는 스마트맥진 프로젝트의 반응형 디자인 개선사항과 사용법을 설명합니다.

## 주요 개선사항

### 1. 성능 최적화된 반응형 훅

```javascript
import { useResponsive } from '../components/Common/ResponsiveWrapper';

const MyComponent = () => {
  const responsive = useResponsive();
  
  return (
    <div>
      {responsive.isMobile && <MobileView />}
      {responsive.isTablet && <TabletView />}
      {responsive.isDesktop && <DesktopView />}
      {responsive.isLarge && <LargeView />}
      
      <p>현재 브레이크포인트: {responsive.currentBreakpoint}</p>
    </div>
  );
};
```

### 2. 터치 제스처 지원

```javascript
import { TouchGestureWrapper, useTouchGestures } from '../components/Common/ResponsiveWrapper';

const SwipeableComponent = () => {
  const handleSwipeLeft = () => console.log('왼쪽으로 스와이프');
  const handleSwipeRight = () => console.log('오른쪽으로 스와이프');
  
  return (
    <TouchGestureWrapper
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      threshold={50}
    >
      <div>스와이프 가능한 영역</div>
    </TouchGestureWrapper>
  );
};
```

### 3. 반응형 레이아웃 컴포넌트

```javascript
import ResponsiveLayout, { 
  ResponsiveDashboard, 
  ResponsiveCardLayout, 
  ResponsiveTableLayout 
} from '../components/Common/ResponsiveLayout';

// 기본 레이아웃
const AppLayout = () => (
  <ResponsiveLayout
    header={<Header />}
    sidebar={<Sidebar />}
    footer={<Footer />}
  >
    <MainContent />
  </ResponsiveLayout>
);

// 대시보드 레이아웃
const Dashboard = () => (
  <ResponsiveDashboard
    stats={[
      { value: '150', label: '총 환자 수', icon: '👥' },
      { value: '25', label: '대기 환자', icon: '⏳' },
      { value: '8', label: '진료 중', icon: '🏥' }
    ]}
    actions={[
      { label: '환자 등록', icon: '➕', onClick: handleAddPatient },
      { label: '대기열 보기', icon: '📋', onClick: handleViewQueue }
    ]}
  >
    <PatientList />
  </ResponsiveDashboard>
);

// 카드 레이아웃
const PatientCard = () => (
  <ResponsiveCardLayout
    title="환자 정보"
    subtitle="상세 정보를 확인하세요"
    actions={[
      { label: '편집', icon: '✏️', onClick: handleEdit },
      { label: '삭제', icon: '🗑️', onClick: handleDelete }
    ]}
    loading={loading}
    error={error}
  >
    <PatientDetails />
  </ResponsiveCardLayout>
);

// 테이블 레이아웃
const PatientTable = () => (
  <ResponsiveTableLayout
    title="환자 목록"
    search={<SearchInput />}
    filters={[
      <StatusFilter key="status" />,
      <DateFilter key="date" />
    ]}
    pagination={<Pagination />}
  >
    <Table data={patients} />
  </ResponsiveTableLayout>
);
```

### 4. 반응형 유틸리티 컴포넌트

```javascript
import { 
  ResponsiveContainer, 
  ResponsiveGrid, 
  ResponsiveText, 
  ResponsiveButton,
  ResponsiveImage,
  MobileOptimized,
  DesktopOptimized
} from '../components/Common/ResponsiveWrapper';

// 반응형 컨테이너
const Container = () => (
  <ResponsiveContainer maxWidth="1200px" fluid={false}>
    <Content />
  </ResponsiveContainer>
);

// 반응형 그리드
const Grid = () => (
  <ResponsiveGrid 
    mobileCols={1} 
    tabletCols={2} 
    desktopCols={3} 
    largeCols={4}
  >
    <Card1 />
    <Card2 />
    <Card3 />
  </ResponsiveGrid>
);

// 반응형 텍스트
const Text = () => (
  <ResponsiveText 
    mobileSize={14} 
    tabletSize={16} 
    desktopSize={18} 
    largeSize={20}
  >
    반응형 텍스트
  </ResponsiveText>
);

// 반응형 버튼
const Button = () => (
  <ResponsiveButton 
    mobileSize="small" 
    tabletSize="middle" 
    desktopSize="large"
    mobileIcon={true}
  >
    버튼
  </ResponsiveButton>
);

// 반응형 이미지
const Image = () => (
  <ResponsiveImage
    src="/images/desktop.jpg"
    mobileSrc="/images/mobile.jpg"
    tabletSrc="/images/tablet.jpg"
    largeSrc="/images/large.jpg"
    alt="반응형 이미지"
  />
);

// 디바이스별 최적화
const OptimizedComponent = () => (
  <>
    <MobileOptimized>
      <MobileView />
    </MobileOptimized>
    
    <DesktopOptimized>
      <DesktopView />
    </DesktopOptimized>
  </>
);
```

## CSS 클래스 사용법

### 1. 반응형 유틸리티 클래스

```css
/* 기본 반응형 컨테이너 */
.responsive-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

/* 반응형 그리드 */
.responsive-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* 모바일 최적화 */
.mobile-optimized {
  padding: 8px;
  margin: 4px;
}

/* 터치 친화적 */
.touch-friendly {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
}

/* GPU 가속 */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}

/* 스켈레톤 로딩 */
.skeleton-loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}
```

### 2. 브레이크포인트별 스타일

```css
/* 모바일 (max-width: 767px) */
@media (max-width: 767px) {
  .mobile-text {
    font-size: 16px;
    line-height: 1.5;
  }
  
  .mobile-button-stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

/* 태블릿 (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .tablet-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
  }
}

/* 데스크톱 (min-width: 1024px) */
@media (min-width: 1024px) {
  .desktop-layout {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }
  
  .desktop-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
}

/* 대형 화면 (min-width: 1440px) */
@media (min-width: 1440px) {
  .large-layout {
    max-width: 1400px;
    padding: 0 32px;
  }
  
  .large-text {
    font-size: 18px;
    line-height: 1.6;
  }
}
```

## 접근성 개선

### 1. 키보드 네비게이션

```javascript
import { KeyboardNavigationWrapper } from '../components/Common/ResponsiveWrapper';

const KeyboardComponent = () => (
  <KeyboardNavigationWrapper
    onEnter={() => console.log('Enter pressed')}
    onEscape={() => console.log('Escape pressed')}
    onArrowUp={() => console.log('Arrow Up pressed')}
    onArrowDown={() => console.log('Arrow Down pressed')}
  >
    <div tabIndex={0}>키보드로 접근 가능한 요소</div>
  </KeyboardNavigationWrapper>
);
```

### 2. 접근성 래퍼

```javascript
import { AccessibilityWrapper } from '../components/Common/ResponsiveWrapper';

const AccessibleComponent = () => (
  <AccessibilityWrapper
    role="button"
    aria-label="환자 추가 버튼"
    aria-describedby="patient-add-description"
    tabIndex={0}
  >
    <button>환자 추가</button>
  </AccessibilityWrapper>
);
```

## 성능 최적화

### 1. 로딩 상태 최적화

```javascript
import { LoadingWrapper } from '../components/Common/ResponsiveWrapper';

const LoadingComponent = () => (
  <LoadingWrapper
    loading={loading}
    error={error}
    skeleton={true}
    skeletonCount={5}
    retry={handleRetry}
  >
    <Content />
  </LoadingWrapper>
);
```

### 2. 이미지 최적화

```javascript
// 반응형 이미지 사용
<ResponsiveImage
  src="/images/patient-desktop.jpg"
  mobileSrc="/images/patient-mobile.jpg"
  alt="환자 이미지"
  loading="lazy"
/>
```

## 모바일 최적화

### 1. 터치 친화적 디자인

```css
/* 터치 디바이스에서 최소 터치 영역 보장 */
@media (hover: none) and (pointer: coarse) {
  button, .ant-btn, input, .ant-input {
    min-height: 44px;
    min-width: 44px;
  }
  
  .touch-friendly {
    padding: 12px;
    margin: 8px;
  }
}
```

### 2. 모바일 스크롤 최적화

```css
.mobile-scroll-optimized {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}
```

## 테마 지원

### 1. 다크모드

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background-color: #1a1a1a;
    --text-color: #ffffff;
    --card-background: #2d2d2d;
    --border-color: #404040;
  }
}
```

### 2. 고대비 모드

```css
@media (prefers-contrast: high) {
  .ant-card {
    border: 2px solid #000;
    background: #fff;
  }
  
  .ant-btn {
    border: 2px solid #000;
    background: #fff;
    color: #000;
  }
}
```

## 인쇄 최적화

```css
@media print {
  .print-hide {
    display: none;
  }
  
  * {
    background: transparent;
    color: #000;
    box-shadow: none;
  }
  
  .page-break-before {
    page-break-before: always;
  }
  
  .page-break-inside-avoid {
    page-break-inside: avoid;
  }
}
```

## 모범 사례

### 1. 컴포넌트 설계

```javascript
// ✅ 좋은 예시
const PatientCard = () => {
  const responsive = useResponsive();
  
  return (
    <ResponsiveCardLayout
      title="환자 정보"
      actions={[
        { label: '편집', icon: '✏️', onClick: handleEdit }
      ]}
    >
      {responsive.isMobile ? (
        <MobilePatientView />
      ) : (
        <DesktopPatientView />
      )}
    </ResponsiveCardLayout>
  );
};

// ❌ 나쁜 예시
const PatientCard = () => (
  <div className="patient-card">
    <h2>환자 정보</h2>
    <div className="patient-content">
      {/* 반응형 처리가 없는 하드코딩된 레이아웃 */}
    </div>
  </div>
);
```

### 2. 성능 최적화

```javascript
// ✅ 좋은 예시 - 메모이제이션 사용
const ResponsiveComponent = React.memo(() => {
  const responsive = useResponsive();
  
  const content = useMemo(() => {
    if (responsive.isMobile) return <MobileContent />;
    if (responsive.isTablet) return <TabletContent />;
    return <DesktopContent />;
  }, [responsive.isMobile, responsive.isTablet]);
  
  return <div>{content}</div>;
});

// ❌ 나쁜 예시 - 매번 재렌더링
const ResponsiveComponent = () => {
  const responsive = useResponsive();
  
  if (responsive.isMobile) return <MobileContent />;
  if (responsive.isTablet) return <TabletContent />;
  return <DesktopContent />;
};
```

## 테스트 방법

### 1. 브라우저 개발자 도구

1. F12를 눌러 개발자 도구 열기
2. 디바이스 툴바 활성화 (Ctrl+Shift+M)
3. 다양한 디바이스 크기로 테스트
4. 네트워크 속도 조절로 성능 테스트

### 2. 접근성 테스트

```javascript
// 키보드 네비게이션 테스트
document.addEventListener('keydown', (e) => {
  console.log('Key pressed:', e.key);
});

// 스크린 리더 테스트
// NVDA, JAWS, VoiceOver 등 사용
```

### 3. 성능 테스트

```javascript
// 렌더링 성능 측정
const measurePerformance = () => {
  const start = performance.now();
  // 컴포넌트 렌더링
  const end = performance.now();
  console.log(`렌더링 시간: ${end - start}ms`);
};
```

## 문제 해결

### 1. 일반적인 문제들

**Q: 모바일에서 터치가 잘 안 되는 경우**
A: `touch-friendly` 클래스 추가 및 최소 터치 영역 44px 보장

**Q: 반응형 이미지가 로드되지 않는 경우**
A: 이미지 경로 확인 및 `loading="lazy"` 속성 추가

**Q: 키보드 네비게이션이 작동하지 않는 경우**
A: `tabIndex` 속성 확인 및 `KeyboardNavigationWrapper` 사용

### 2. 디버깅 팁

```javascript
// 반응형 상태 디버깅
const ResponsiveDebugger = () => {
  const responsive = useResponsive();
  
  console.log('Responsive state:', responsive);
  
  return (
    <div style={{ position: 'fixed', top: 0, right: 0, background: 'red', color: 'white', padding: '4px' }}>
      {responsive.currentBreakpoint}
    </div>
  );
};
```

## 결론

이 가이드를 통해 프로젝트의 반응형 디자인을 효과적으로 구현하고 유지보수할 수 있습니다. 모든 새로운 컴포넌트는 이 가이드의 원칙을 따라 개발하시기 바랍니다. 