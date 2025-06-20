/**
 * 음성 안내 유틸리티
 */

// 음성 안내 설정
const speechConfig = {
  lang: 'ko-KR',
  pitch: 1,
  rate: 1,
  volume: 1
};

// 음성 합성 상태
let isInitialized = false;
let voices = [];
let isSpeaking = false;
let speechQueue = [];

/**
 * 음성 합성 지원 여부 체크
 */
export const isSpeechSynthesisSupported = () => {
  return typeof window !== 'undefined' && 
         'speechSynthesis' in window && 
         typeof window.SpeechSynthesisUtterance === 'function';
};

/**
 * 안전한 음성 합성 함수
 */
export const safeSpeak = async (text) => {
  if (!isSpeechSynthesisSupported()) {
    console.warn('⚠️ 이 브라우저는 음성 합성을 지원하지 않습니다.');
    return;
  }

  try {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      console.warn('⚠️ 사용 가능한 음성 목록이 없습니다.');
      return;
    }

    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.voice = voices.find(voice => voice.lang.includes('ko')) || voices[0];
    utterance.lang = 'ko-KR';
    
    window.speechSynthesis.cancel(); // 기존 발화 중지
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error('❌ 음성 합성 실패:', e);
  }
};

/**
 * 음성 합성 초기화
 */
export const initSpeech = () => {
  if (!isSpeechSynthesisSupported()) {
    console.warn('⚠️ 음성 합성을 지원하지 않는 브라우저입니다.');
    return Promise.reject(new Error('음성 합성을 지원하지 않습니다.'));
  }

  return new Promise((resolve, reject) => {
    try {
      const synth = window.speechSynthesis;
      
      const loadVoices = () => {
        voices = synth.getVoices();
        if (voices.length > 0) {
          console.log('✅ 음성 목록 로드 완료:', voices.length);
          isInitialized = true;
          resolve(voices);
        } else {
          console.log('⏳ 음성 목록 로딩 중...');
          setTimeout(loadVoices, 100);
        }
      };

      synth.onvoiceschanged = () => {
        console.log('🔄 음성 목록 변경 감지');
        loadVoices();
      };

      loadVoices();
    } catch (error) {
      console.error('❌ 음성 합성 초기화 실패:', error);
      reject(error);
    }
  });
};

/**
 * 현재 사용 가능한 음성 목록 조회
 */
export const getVoices = () => {
  if (!isSpeechSynthesisSupported()) {
    return [];
  }
  return voices;
};

/**
 * 음성 재생 큐 처리
 */
const processSpeechQueue = async () => {
  if (speechQueue.length === 0 || isSpeaking) return;

  if (!isInitialized || voices.length === 0) {
    try {
      await initSpeech();
    } catch (error) {
      console.error('음성 합성 초기화 재시도 실패:', error);
      return;
    }
  }

  isSpeaking = true;
  const { text, options, resolve, reject } = speechQueue[0];

  try {
    if (window.speechSynthesis.speaking) {
      console.log('🔁 기존 음성 중단 시도');
      window.speechSynthesis.cancel();
      await new Promise(res => setTimeout(res, 200));
    }

    const utterance = new SpeechSynthesisUtterance(text);
    Object.assign(utterance, speechConfig, options);

    let koreanVoice = voices.find(voice => voice.lang.includes('ko'));
    
    if (!koreanVoice && voices.length > 0) {
      console.warn('⚠️ 한국어 음성을 찾을 수 없습니다. 기본 음성을 사용합니다.');
      koreanVoice = voices[0];
    }

    utterance.voice = koreanVoice || null;
    utterance.lang = 'ko-KR';

    utterance.onstart = () => {
      console.log('✅ 음성 출력 시작:', text);
    };

    utterance.onend = () => {
      console.log('✅ 음성 출력 완료:', text);
      isSpeaking = false;
      speechQueue.shift();
      resolve();
      processSpeechQueue();
    };

    utterance.onerror = (err) => {
      console.error(`❌ 음성 합성 오류: ${err.error}`, err);
      isSpeaking = false;
      speechQueue.shift();
      processSpeechQueue();
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error('🛑 음성 출력 실패:', e);
    isSpeaking = false;
    speechQueue.shift();
    reject(e);
    processSpeechQueue();
  }
};

/**
 * 텍스트를 음성으로 변환하여 재생
 */
export const speak = async (text, options = {}) => {
  if (!isSpeechSynthesisSupported()) {
    console.warn('⚠️ 음성 합성을 지원하지 않는 브라우저입니다.');
    return;
  }

  try {
    if (!isInitialized) {
      await initSpeech();
    }

    return new Promise((resolve, reject) => {
      if (!text || typeof text !== 'string' || text.trim() === '') {
        console.error('❌ 유효하지 않은 음성 텍스트:', text);
        reject(new Error('출력할 텍스트가 유효하지 않습니다.'));
        return;
      }

      speechQueue.push({ text: text.trim(), options, resolve, reject });
      processSpeechQueue();
    });
  } catch (error) {
    console.error('음성 출력 초기화 오류:', error);
    throw error;
  }
};

/**
 * 환자 호출 음성 안내
 */
export const announcePatientCall = async (patientName) => {
  if (!isSpeechSynthesisSupported()) {
    console.warn('⚠️ 음성 합성을 지원하지 않는 브라우저입니다.');
    return;
  }

  try {
    if (!patientName || typeof patientName !== 'string' || patientName.trim() === '') {
      throw new Error('유효하지 않은 환자 이름입니다.');
    }

    if (!isInitialized) {
      await initSpeech();
    }

    window.speechSynthesis.cancel();
    await new Promise((res) => setTimeout(res, 100));
    speechQueue = [];
    isSpeaking = false;
    
    console.log('🔊 대기실 멘트 시작');
    await speak(`${patientName}님 진료실로 입장하십시오`);
    
    console.log('⏳ 3초 대기 시작');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔊 진료실 멘트 시작');
    await speak(`${patientName}님이 진료실에 입장하십니다`);
    
    console.log('✅ 모든 음성 멘트 완료');
  } catch (error) {
    console.error('❌ 음성 안내 실패:', error);
    speechQueue = [];
    isSpeaking = false;
    isInitialized = false;
    throw error;
  }
};

export const speakText = async (text) => {
  if (!isSpeechSynthesisSupported()) {
    console.warn('❌ 브라우저가 speechSynthesis를 지원하지 않습니다.');
    return;
  }

  try {
    // 음성 목록 비동기 초기화
    const getVoicesAsync = () =>
      new Promise((resolve) => {
        let voices = window.speechSynthesis.getVoices();
        if (voices.length) return resolve(voices);
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          resolve(voices);
        };
      });

    const voices = await getVoicesAsync();
    if (!voices || voices.length === 0) {
      console.warn('⚠️ 사용 가능한 음성 목록이 없습니다.');
      return;
    }

    const utterance = new window.SpeechSynthesisUtterance(text);

    // 한국어 음성 우선 적용
    const koreanVoice = voices.find((v) => v.lang === 'ko-KR');
    if (koreanVoice) utterance.voice = koreanVoice;

    window.speechSynthesis.cancel(); // 기존 발화 중지
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('❌ 음성 합성 실패:', error);
  }
};

export default {
  initSpeech,
  speak,
  announcePatientCall,
  getVoices,
  isSpeechSynthesisSupported,
  safeSpeak
};