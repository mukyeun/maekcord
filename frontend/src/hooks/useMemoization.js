import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

/**
 * 깊은 비교를 통한 메모이제이션
 * @param {Function} factory - 메모이제이션할 함수
 * @param {Array} deps - 의존성 배열
 * @returns {any} 메모이제이션된 값
 */
export const useDeepMemo = (factory, deps) => {
  const prevDepsRef = useRef();
  const prevValueRef = useRef();

  const isEqual = (a, b) => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      
      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => isEqual(item, b[index]));
      }
      
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => isEqual(a[key], b[key]));
    }
    
    return false;
  };

  const currentDeps = deps;
  const prevDeps = prevDepsRef.current;

  if (!isEqual(prevDeps, currentDeps)) {
    prevDepsRef.current = currentDeps;
    prevValueRef.current = factory();
  }

  return prevValueRef.current;
};

/**
 * 디바운스된 값
 * @param {any} value - 디바운스할 값
 * @param {number} delay - 지연 시간 (ms)
 * @returns {any} 디바운스된 값
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * 쓰로틀된 콜백
 * @param {Function} callback - 쓰로틀할 콜백 함수
 * @param {number} delay - 지연 시간 (ms)
 * @returns {Function} 쓰로틀된 콜백
 */
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

/**
 * 가상화를 위한 아이템 계산
 * @param {Array} items - 아이템 배열
 * @param {number} itemHeight - 아이템 높이
 * @param {number} containerHeight - 컨테이너 높이
 * @param {number} scrollTop - 스크롤 위치
 * @returns {Object} 가상화 정보
 */
export const useVirtualization = (items, itemHeight, containerHeight, scrollTop) => {
  return useMemo(() => {
    const visibleItemCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleItemCount + 1, items.length);
    
    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * itemHeight;
    
    return {
      visibleItems,
      offsetY,
      startIndex,
      endIndex,
      totalHeight: items.length * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop]);
};

/**
 * 이미지 지연 로딩
 * @param {string} src - 이미지 소스
 * @param {string} placeholder - 플레이스홀더 이미지
 * @returns {Object} 이미지 로딩 상태
 */
export const useImageLazyLoad = (src, placeholder = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!src) {
      setImageSrc(placeholder);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setError('이미지 로딩 실패');
      setImageSrc(placeholder);
      setIsLoading(false);
    };
  }, [src, placeholder]);

  return { imageSrc, isLoading, error };
};

/**
 * 성능 측정 훅
 * @param {string} name - 측정 이름
 * @returns {Function} 측정 함수
 */
export const usePerformance = (name) => {
  return useCallback((fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }, [name]);
};

/**
 * 메모리 사용량 모니터링
 * @returns {Object} 메모리 정보
 */
export const useMemoryUsage = () => {
  const [memoryInfo, setMemoryInfo] = useState(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo({
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}; 