const speechUtils = {
  initSpeechSynthesis: () => {
    if (typeof window === 'undefined') return null;
    return new Promise((resolve, reject) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length) {
        resolve(voices);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          resolve(window.speechSynthesis.getVoices());
        };
      }
    });
  },

  speakNext: async (speechQueue, isSpeaking) => {
    if (speechQueue.length > 0 && !isSpeaking) {
      isSpeaking = true;
      const utterance = speechQueue.shift();
      utterance.onend = () => {
        isSpeaking = false;
        speechUtils.speakNext(speechQueue, isSpeaking);
      };

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      window.speechSynthesis.speak(utterance);
    }
  },

  addToSpeechQueue: (text, speechQueue) => {
    const utterance = new SpeechSynthesisUtterance(text);
    speechQueue.push(utterance);
    speechUtils.speakNext(speechQueue, false);
  },

  speakText: (text) => {
    speechUtils.initSpeechSynthesis().then((voices) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voices.find(voice => voice.lang === 'ko-KR') || voices[0];
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
      };
      window.speechSynthesis.speak(utterance);
    });
  }
};

module.exports = speechUtils;
