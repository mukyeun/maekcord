let speaking = false;

export const speak = (text) => {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      console.error('이 브라우저는 음성 합성을 지원하지 않습니다.');
      reject(new Error('음성 합성 미지원'));
      return;
    }

    // 이미 음성이 출력 중이면 중단
    if (speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 한국어 음성 설정
    const voices = window.speechSynthesis.getVoices();
    const koreanVoice = voices.find(voice => voice.lang.includes('ko'));
    if (koreanVoice) {
      utterance.voice = koreanVoice;
    }
    
    utterance.lang = 'ko-KR';
    utterance.volume = 1.0;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    speaking = true;

    utterance.onend = () => {
      speaking = false;
      console.log('음성 출력 완료:', text);
      resolve();
    };

    utterance.onerror = (event) => {
      speaking = false;
      console.error('음성 출력 오류:', event);
      reject(event);
    };

    // voices가 아직 로드되지 않았을 경우를 대비
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        const koreanVoice = voices.find(voice => voice.lang.includes('ko'));
        if (koreanVoice) {
          utterance.voice = koreanVoice;
        }
        window.speechSynthesis.speak(utterance);
      };
    } else {
      window.speechSynthesis.speak(utterance);
    }
  });
};

export const playNotificationSound = () => {
  const audio = new Audio('/notification.mp3');
  audio.play();
}; 