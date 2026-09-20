import { storage } from '../utils/storage';
import { MusicService } from './MusicService';
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
  readonly music = new MusicService();
  private context?: AudioContext;
  private output?: GainNode;
  constructor() {
    this.music.setMuted(!this.enabled);
  }
  unlock(): void {
    this.music.unlock();
    try {
      this.context ??= new AudioContext();
      if (!this.output) {
        this.output = this.context.createGain();
        this.output.gain.value = this.enabled ? 1 : 0;
        this.output.connect(this.context.destination);
      }
      void this.context.resume().catch(() => {});
    } catch {
      /* Audio is optional when unsupported. */
    }
  }
  toggle(): boolean {
    this.enabled = !this.enabled;
    storage.set('gls:sound', this.enabled ? 'on' : 'off');
    this.music.setMuted(!this.enabled);
    if (this.output) this.output.gain.value = this.enabled ? 1 : 0;
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
      gain.connect(this.output!);
      oscillator.start(start);
      oscillator.stop(start + step + 0.03);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    });
  }
}
