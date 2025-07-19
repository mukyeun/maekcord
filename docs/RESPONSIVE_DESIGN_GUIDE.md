# 반응형 디자인 가이드

## 개요

이 문서는 MaeKCode 프로젝트의 반응형 디자인 시스템과 구현 방법을 설명합니다.

## 디자인 시스템

### 브레이크포인트

```css
/* 모바일 */
@media (max-width: 767px)

/* 태블릿 */
@media (min-width: 768px) and (max-width: 1023px)

/* 데스크톱 */
@media (min-width: 1024px)

/* 대형 화면 */
@media (min-width: 1440px)
```

### CSS 변수

```css
:root {
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #f5222d;
  --font-size-base: 14px;
  --border-radius-base: 6px;
  --box-shadow-base: 0 2px 8px rgba(0, 0, 0, 0.15);
  --transition-duration: 0.3s;
  --mobile-breakpoint: 768px;
  --tablet-breakpoint: 1024px;
  --desktop-breakpoint: 1440px;
}
```

## 컴포넌트 사용법

### 1. 반응형 훅

```jsx
import { useResponsive } from '../components/Common/ResponsiveWrapper';

const MyComponent = () => {
  const responsive = useResponsive();
  
  return (
    <div>
      {responsive.isMobile && <MobileView />}
      {responsive.isTablet && <TabletView />}
      {responsive.isDesktop && <DesktopView />}
    </div>
  );
};
```

### 2. 반응형 그리드

```jsx
import { ResponsiveGrid } from '../components/Common/ResponsiveWrapper';

const MyGrid = () => (
  <ResponsiveGrid
    mobileCols={1}
    tabletCols={2}
    desktopCols={3}
    largeCols={4}
    gutter={[16, 16]}
  >
    <Card>Item 1</Card>
    <Card>Item 2</Card>
    <Card>Item 3</Card>
  </ResponsiveGrid>
);
```

### 3. 반응형 컨테이너

```jsx
import { ResponsiveContainer } from '../components/Common/ResponsiveWrapper';

const MyContainer = () => (
  <ResponsiveContainer
    maxWidth="1200px"
    mobilePadding="8px"
    tabletPadding="12px"
    largePadding="24px"
  >
    <Content />
  </ResponsiveContainer>
);
```

### 4. 반응형 텍스트

```jsx
import { ResponsiveText } from '../components/Common/ResponsiveWrapper';

const MyText = () => (
  <ResponsiveText
    mobileSize={14}
    tabletSize={16}
    desktopSize={18}
    largeSize={20}
  >
    반응형 텍스트
  </ResponsiveText>
);
```

### 5. 접근성 래퍼

```jsx
import { AccessibilityWrapper } from '../components/Common/ResponsiveWrapper';

const MyAccessibleComponent = () => (
  <AccessibilityWrapper
    role="button"
    aria-label="클릭 가능한 버튼"
    tabIndex={0}
  >
    <Button />
  </AccessibilityWrapper>
);
```

### 6. 키보드 네비게이션

```jsx
import { KeyboardNavigationWrapper } from '../components/Common/ResponsiveWrapper';

const MyKeyboardComponent = () => (
  <KeyboardNavigationWrapper
    onEnter={() => console.log('Enter pressed')}
    onSpace={() => console.log('Space pressed')}
    onEscape={() => console.log('Escape pressed')}
  >
    <InteractiveElement />
  </KeyboardNavigationWrapper>
);
```

### 7. 로딩 래퍼

```jsx
import { LoadingWrapper } from '../components/Common/ResponsiveWrapper';

const MyLoadingComponent = () => (
  <LoadingWrapper
    loading={isLoading}
    error={error}
    skeleton={true}
    skeletonCount={3}
    retry={() => retryAction()}
  >
    <Content />
  </LoadingWrapper>
);
```

### 8. 터치 제스처

```jsx
import { TouchGestureWrapper } from '../components/Common/ResponsiveWrapper';

const MyTouchComponent = () => (
  <TouchGestureWrapper
    onSwipeLeft={() => console.log('Swipe left')}
    onSwipeRight={() => console.log('Swipe right')}
    threshold={50}
  >
    <TouchableContent />
  </TouchGestureWrapper>
);
```

### 9. 반응형 이미지

```jsx
import { ResponsiveImage } from '../components/Common/ResponsiveWrapper';

const MyImage = () => (
  <ResponsiveImage
    src="/default.jpg"
    mobileSrc="/mobile.jpg"
    tabletSrc="/tablet.jpg"
    desktopSrc="/desktop.jpg"
    largeSrc="/large.jpg"
    alt="반응형 이미지"
  />
);
```

### 10. 반응형 비디오

```jsx
import { ResponsiveVideo } from '../components/Common/ResponsiveWrapper';

const MyVideo = () => (
  <ResponsiveVideo
    src="/default.mp4"
    mobileSrc="/mobile.mp4"
    controls={true}
    autoPlay={false}
    muted={true}
  />
);
```

### 11. 성능 최적화 래퍼

```jsx
import { PerformanceOptimized } from '../components/Common/ResponsiveWrapper';

const MyOptimizedComponent = () => (
  <PerformanceOptimized shouldOptimize={true}>
    <HeavyComponent />
  </PerformanceOptimized>
);
```

### 12. 스크롤 최적화

```jsx
import { ScrollOptimized } from '../components/Common/ResponsiveWrapper';

const MyScrollComponent = () => (
  <ScrollOptimized smooth={true} touch={true} overscroll={true}>
    <ScrollableContent />
  </ScrollOptimized>
);
```

### 13. 터치 최적화

```jsx
import { TouchOptimized } from '../components/Common/ResponsiveWrapper';

const MyTouchComponent = () => (
  <TouchOptimized manipulation={true} highlight={false} select={false}>
    <TouchableContent />
  </TouchOptimized>
);
```

### 14. 포커스 최적화

```jsx
import { FocusOptimized } from '../components/Common/ResponsiveWrapper';

const MyFocusComponent = () => (
  <FocusOptimized outline={true} offset={2} radius={4}>
    <FocusableContent />
  </FocusOptimized>
);
```

## 접근성 지원

### 1. 고대비 모드

```css
@media (prefers-contrast: high) {
  .ant-btn-primary {
    background: #000;
    color: #fff;
    border: 2px solid #000;
  }
}
```

### 2. 다크 모드

```css
@media (prefers-color-scheme: dark) {
  body {
    background: #141414;
    color: #fff;
  }
}
```

### 3. 모션 감소

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 모바일 최적화

### 1. 터치 타겟

```css
.mobile-touch-target {
  min-height: 48px;
  min-width: 48px;
  padding: 12px 16px;
  font-size: 16px;
  border-radius: 8px;
}
```

### 2. 모바일 헤더

```css
.mobile-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 12px 16px;
}
```

### 3. 모바일 메뉴

```css
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: #fff;
  z-index: 1001;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.mobile-menu.open {
  transform: translateX(0);
}
```

## 태블릿 최적화

### 1. 태블릿 사이드바

```css
.tablet-sidebar {
  width: 250px;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 1000;
  background: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}
```

### 2. 태블릿 그리드

```css
.tablet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}
```

## 데스크톱 최적화

### 1. 데스크톱 레이아웃

```css
.desktop-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}
```

### 2. 데스크톱 호버 효과

```css
.desktop-hover {
  transition: all 0.3s ease;
}

.desktop-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
```

## 성능 최적화

### 1. GPU 가속

```css
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
  perspective: 1000px;
}
```

### 2. 스켈레톤 로딩

```css
.skeleton-loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 3. 스크롤 최적화

```css
.scroll-optimized {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  overscroll-behavior: contain;
}
```

## 유틸리티 클래스

### 1. 반응형 숨김/표시

```css
.hidden-mobile { display: none; }
.responsive-hidden { display: none; }

@media (min-width: 768px) {
  .hidden-mobile { display: block; }
  .responsive-hidden-md { display: none; }
}
```

### 2. 반응형 텍스트 정렬

```css
.text-center-mobile { text-align: center; }

@media (min-width: 768px) {
  .text-center-mobile { text-align: left; }
}
```

### 3. 반응형 패딩

```css
.padding-mobile { padding: 16px; }

@media (min-width: 768px) {
  .padding-mobile { padding: 24px; }
}

@media (min-width: 1024px) {
  .padding-mobile { padding: 32px; }
}
```

## 인쇄 최적화

```css
@media print {
  .print-hide { display: none !important; }
  
  * {
    background: transparent !important;
    color: #000 !important;
    box-shadow: none !important;
  }
  
  .page-break-before { page-break-before: always; }
  .page-break-after { page-break-after: always; }
  .page-break-inside-avoid { page-break-inside: avoid; }
}
```

## 모범 사례

### 1. 모바일 우선 설계

- 모바일부터 시작하여 점진적으로 확장
- 터치 친화적인 인터페이스 설계
- 적절한 터치 타겟 크기 (최소 44px)

### 2. 성능 최적화

- 이미지 지연 로딩 사용
- CSS 애니메이션 최적화
- 불필요한 리렌더링 방지

### 3. 접근성 고려

- 키보드 네비게이션 지원
- 스크린 리더 호환성
- 색상 대비 충분히 확보

### 4. 사용자 경험

- 일관된 인터랙션 패턴
- 명확한 시각적 피드백
- 직관적인 네비게이션

## 테스트 방법

### 1. 브라우저 개발자 도구

- 다양한 화면 크기로 테스트
- 네트워크 속도 시뮬레이션
- 디바이스 에뮬레이션

### 2. 실제 디바이스 테스트

- 다양한 모바일 디바이스
- 태블릿 디바이스
- 데스크톱 모니터

### 3. 접근성 테스트

- 키보드만으로 네비게이션
- 스크린 리더 사용
- 고대비 모드 테스트

## 문제 해결

### 1. 깜빡임 문제

```css
* {
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform;
}
```

### 2. 터치 반응성 문제

```css
.touch-friendly {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
  margin: 8px;
  border-radius: 8px;
}
```

### 3. 스크롤 성능 문제

```css
.scroll-optimized {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  overscroll-behavior: contain;
}
```

## 업데이트 내역

### v2.0.0 (2025-01-18)
- 접근성 훅 추가 (`useAccessibility`)
- 새로운 반응형 컴포넌트 추가
- 성능 최적화 래퍼 추가
- 터치 및 스크롤 최적화 개선
- 다크 모드 및 고대비 모드 지원 강화

### v1.0.0 (2025-01-17)
- 기본 반응형 시스템 구축
- 모바일/태블릿/데스크톱 지원
- 기본 유틸리티 컴포넌트 제공 