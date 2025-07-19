import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';
import App from './App';
import 'antd/dist/reset.css';
import performanceMonitor from './utils/performanceMonitor';

// 전역 에러 핸들러 추가
window.addEventListener('error', (event) => {
  console.error('전역 에러 발생:', event.error);
  console.error('에러 스택:', event.error?.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('처리되지 않은 Promise 거부:', event.reason);
});

// 청크 로딩 타임아웃 설정 (개발 모드)
if (process.env.NODE_ENV === 'development') {
  // Webpack 청크 로딩 타임아웃 늘리기
  if (window.__webpack_require__) {
    const originalChunkLoading = window.__webpack_require__.f.j;
    window.__webpack_require__.f.j = function(chunkId) {
      return originalChunkLoading.call(this, chunkId).catch(error => {
        console.warn('청크 로딩 실패, 재시도 중...', chunkId, error);
        // 재시도 로직
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            originalChunkLoading.call(this, chunkId)
              .then(resolve)
              .catch(reject);
          }, 1000);
        });
      });
    };
  }
  
  // 성능 모니터링 일시 비활성화 (심각한 문제 해결 후 재활성화)
  // performanceMonitor.startFPSCounter();
  
  // React DevTools 비활성화 (성능 향상)
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = function () {};
  }
}

// GPU 가속 활성화
document.body.style.transform = 'translateZ(0)';
document.body.style.willChange = 'transform';
document.body.style.backfaceVisibility = 'hidden';

// 깜빡임 방지를 위한 추가 설정
document.documentElement.style.transform = 'translateZ(0)';
document.documentElement.style.willChange = 'transform';

// 스크롤 성능 최적화
document.documentElement.style.scrollBehavior = 'smooth';
document.documentElement.style.webkitOverflowScrolling = 'touch';

// 폰트 렌더링 최적화
document.body.style.webkitFontSmoothing = 'antialiased';
document.body.style.mozOsxFontSmoothing = 'grayscale';
document.body.style.textRendering = 'optimizeLegibility';

const container = document.getElementById('root');

// 컨테이너 존재 확인
if (!container) {
  console.error('Root 컨테이너를 찾을 수 없습니다!');
  document.body.innerHTML = '<div style="padding: 20px; text-align: center; font-family: monospace;"><h2>앱 초기화 오류</h2><p>Root 컨테이너를 찾을 수 없습니다.</p><button onclick="window.location.reload()">페이지 새로고침</button></div>';
} else {
  const root = createRoot(container);

  // 에러 바운더리 추가
  const ErrorFallback = ({ error }) => {
    console.error('앱 에러:', error);
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        fontFamily: 'monospace',
        backgroundColor: '#fff',
        border: '1px solid #ff4d4f',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h2 style={{ color: '#ff4d4f' }}>앱에서 오류가 발생했습니다</h2>
        <p style={{ color: '#666' }}>{error.message}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          페이지 새로고침
        </button>
      </div>
    );
  };

  // 성능 최적화된 렌더링
  const renderApp = () => {
    try {
      console.log('앱 렌더링 시작...');
      root.render(
        <ConfigProvider locale={koKR}>
          <App />
        </ConfigProvider>
      );
      console.log('앱 렌더링 완료');
    } catch (error) {
      console.error('앱 렌더링 중 오류 발생:', error);
      root.render(<ErrorFallback error={error} />);
    }
  };

  // 렌더링 시작
  renderApp();
}