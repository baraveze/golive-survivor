import { storage } from '../utils/storage';
type Sound = 'shot' | 'hit' | 'kill' | 'warning' | 'hotfix' | 'down' | 'victory';
const NOTES: Record<Sound, number[]> = {
  shot: [620, 420],
  hit: [110, 65],
  kill: [700, 980],
  warning: [220, 440, 220, 440],
  hotfix: [130, 260, 520, 1040],
  down: [300, 220, 140, 70],
  victory: [523, 659, 784, 1047],
};
export class AudioService {
  enabled = storage.get('gls:sound') !== 'off';
  private context?: AudioContext;
  unlock(): void {
    try {
      this.context ??= new AudioContext();
      void this.context.resume().catch(() => {});
    } catch {
      /* Audio is optional when unsupported. */
    }
  }
  toggle(): boolean {
    this.enabled = !this.enabled;
    storage.set('gls:sound', this.enabled ? 'on' : 'off');
    if (this.enabled) {
      this.unlock();
      this.play('kill');
    }
    return this.enabled;
  }
  play(sound: Sound): void {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const context = this.context;
    const step = sound === 'shot' ? 0.035 : 0.075;
    NOTES[sound].forEach((frequency, i) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + i * step;
      oscillator.type = sound === 'hit' || sound === 'down' ? 'sawtooth' : 'square';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(sound === 'shot' ? 0.012 : 0.035, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + step + 0.025);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + step + 0.03);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    });
  }
}
