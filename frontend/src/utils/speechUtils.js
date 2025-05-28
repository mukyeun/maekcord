// 음성 초기화
export const initSpeech = () => {
  if (window.speechSynthesis) {
    // 사용 가능한 음성 목록 로드
    window.speechSynthesis.getVoices();
    
    // Chrome 버그 대응
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }
};

// 음성 출력
export const speak = (text) => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.speechSynthesis) {
        console.error('이 브라우저는 음성 합성을 지원하지 않습니다.');
        reject(new Error('음성 합성 미지원'));
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.pitch = 1;
      utterance.rate = 0.9;
      utterance.volume = 1;

      utterance.onend = () => {
        console.log('✅ 음성 출력 완료:', text);
        resolve();
      };

      utterance.onerror = (error) => {
        console.error('❌ 음성 출력 오류:', error);
        reject(error);
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('음성 출력 초기화 오류:', error);
      reject(error);
    }
  });
};