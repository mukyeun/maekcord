import React, { useEffect } from 'react';

// 성능 모니터링 유틸리티
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: [],
      memory: [],
      renderTime: [],
      errors: []
    };
    this.isMonitoring = false;
    this.frameCount = 0;
    this.lastTime = performance.now();
  }

  // FPS 모니터링 시작
  startFPSCounter() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastTime = performance.now();
    
    const measureFPS = () => {
      if (!this.isMonitoring) return;
      
      this.frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - this.lastTime >= 1000) {
        const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        this.metrics.fps.push({
          timestamp: currentTime,
          value: fps
        });
        
        // FPS가 낮으면 경고
        if (fps < 30) {
          console.warn(`낮은 FPS 감지: ${fps}`, {
            memory: this.getMemoryInfo(),
            timestamp: new Date().toISOString()
          });
        }
        
        this.frameCount = 0;
        this.lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  // 메모리 사용량 확인
  getMemoryInfo() {
    if ('memory' in performance) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      };
    }
    return null;
  }

  // 렌더링 시간 측정
  measureRenderTime(componentName) {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      const renderTime = end - start;
      
      this.metrics.renderTime.push({
        component: componentName,
        timestamp: end,
        duration: renderTime
      });
      
      // 렌더링 시간이 길면 경고
      if (renderTime > 16) { // 60fps 기준
        console.warn(`느린 렌더링 감지: ${componentName}`, {
          duration: renderTime,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  // 에러 추적
  trackError(error, componentName) {
    this.metrics.errors.push({
      error: error.message,
      component: componentName,
      timestamp: performance.now(),
      stack: error.stack
    });
    
    console.error(`컴포넌트 에러: ${componentName}`, error);
  }

  // 성능 메트릭 가져오기
  getMetrics() {
    return {
      ...this.metrics,
      currentFPS: this.metrics.fps.length > 0 ? this.metrics.fps[this.metrics.fps.length - 1].value : 0,
      averageFPS: this.metrics.fps.length > 0 
        ? Math.round(this.metrics.fps.reduce((sum, m) => sum + m.value, 0) / this.metrics.fps.length)
        : 0,
      memory: this.getMemoryInfo()
    };
  }

  // 모니터링 중지
  stop() {
    this.isMonitoring = false;
  }

  // 성능 최적화 제안
  getOptimizationSuggestions() {
    const suggestions = [];
    const metrics = this.getMetrics();
    
    if (metrics.currentFPS < 30) {
      suggestions.push('FPS가 낮습니다. 불필요한 리렌더링을 줄이세요.');
    }
    
    if (metrics.memory && metrics.memory.used > metrics.memory.limit * 0.8) {
      suggestions.push('메모리 사용량이 높습니다. 메모리 누수를 확인하세요.');
    }
    
    const slowRenders = this.metrics.renderTime.filter(rt => rt.duration > 16);
    if (slowRenders.length > 0) {
      const slowestComponent = slowRenders.reduce((prev, current) => 
        prev.duration > current.duration ? prev : current
      );
      suggestions.push(`${slowestComponent.component} 컴포넌트의 렌더링이 느립니다.`);
    }
    
    return suggestions;
  }
}

// 전역 성능 모니터 인스턴스
const performanceMonitor = new PerformanceMonitor();

// 자동 시작 (개발 모드에서만)
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.startFPSCounter();
}

export default performanceMonitor;

// React 컴포넌트용 HOC
export const withPerformanceTracking = (WrappedComponent, componentName) => {
  return React.memo((props) => {
    const endMeasure = performanceMonitor.measureRenderTime(componentName);
    
    useEffect(() => {
      endMeasure();
    });
    
    return <WrappedComponent {...props} />;
  });
};

// 에러 바운더리용 에러 추적
export const trackError = (error, componentName) => {
  performanceMonitor.trackError(error, componentName);
}; 