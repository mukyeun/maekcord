class SoundManager {
  constructor() {
    this.audioContext = null;
  }

  initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  async playDingDong() {
    try {
      this.initialize();
      
      const oscillator1 = this.audioContext.createOscillator();
      const oscillator2 = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // 첫 번째 음 (높은 음)
      oscillator1.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5
      oscillator2.frequency.setValueAtTime(1108.73, this.audioContext.currentTime); // C#6

      // 볼륨 설정
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);

      oscillator1.start(this.audioContext.currentTime);
      oscillator2.start(this.audioContext.currentTime);
      oscillator1.stop(this.audioContext.currentTime + 0.5);
      oscillator2.stop(this.audioContext.currentTime + 0.5);

    } catch (error) {
      console.error('소리 재생 중 오류:', error);
    }
  }
}

export const soundManager = new SoundManager(); 