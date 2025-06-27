import { useEffect, useCallback } from 'react';
import { message } from 'antd';

/**
 * 키보드 단축키 지원을 위한 커스텀 훅
 * @param {Object} shortcuts - 단축키 매핑 객체
 * @param {boolean} enabled - 단축키 활성화 여부
 * @returns {Object} 단축키 관련 함수들
 */
const useKeyboardShortcuts = (shortcuts = {}, enabled = true) => {
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // 입력 필드에 포커스가 있을 때는 단축키 비활성화
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true' ||
      activeElement.classList.contains('ant-select-selector')
    )) {
      return;
    }

    // 단축키 조합 생성
    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;
    const alt = event.altKey;

    const shortcutKey = [
      ctrl && 'ctrl',
      shift && 'shift',
      alt && 'alt',
      key
    ].filter(Boolean).join('+');

    // 단축키 매핑 확인
    const shortcut = shortcuts[shortcutKey];
    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();
      
      try {
        shortcut.action();
        
        // 단축키 사용 알림 (개발 모드에서만)
        if (process.env.NODE_ENV === 'development') {
          console.log(`⌨️ 단축키 실행: ${shortcutKey} - ${shortcut.description}`);
        }
        
        // 사용자에게 피드백 제공
        if (shortcut.showFeedback !== false) {
          message.info(`${shortcut.description} (${shortcutKey})`);
        }
      } catch (error) {
        console.error('단축키 실행 오류:', error);
        message.error('단축키 실행 중 오류가 발생했습니다.');
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  // 단축키 도움말 생성
  const getShortcutsHelp = useCallback(() => {
    return Object.entries(shortcuts).map(([key, shortcut]) => ({
      key,
      description: shortcut.description,
      category: shortcut.category || '기타'
    }));
  }, [shortcuts]);

  return {
    getShortcutsHelp,
    enabled
  };
};

export default useKeyboardShortcuts; 