import { storage } from '../utils/storage';

type MusicScene = 'home' | 'game';
const TRACKS: Record<MusicScene, string> = {
  home: 'dream-culture.mp3',
  game: 'bit-quest.mp3',
};

/** One player prevents overlapping tracks, including during rapid screen changes. */
export class MusicService {
  enabled = storage.get('gls:music') !== 'off';
  private player?: HTMLAudioElement;
  private scene: MusicScene = 'home';
  private paused = false;
  private hidden = false;
  private unlocked = false;
  private muted = false;

  constructor(private createPlayer: () => HTMLAudioElement = () => new Audio()) {}

  unlock(): void {
    this.unlocked = true;
    this.sync();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    storage.set('gls:music', enabled ? 'on' : 'off');
    this.sync();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.sync();
  }

  setScene(scene: MusicScene): void {
    if (this.scene === scene && !this.paused) return;
    const changed = this.scene !== scene;
    this.scene = scene;
    this.paused = false;
    if (changed && this.player) {
      this.player.pause();
      this.player.src = this.source();
    }
    this.sync();
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    this.sync();
  }

  setHidden(hidden: boolean): void {
    this.hidden = hidden;
    this.sync();
  }

  private source(): string {
    return `${import.meta.env.BASE_URL}audio/${TRACKS[this.scene]}`;
  }

  private sync(): void {
    if (!this.enabled || this.muted || this.paused || this.hidden || !this.unlocked) {
      this.player?.pause();
      return;
    }
    try {
      if (!this.player) {
        this.player = this.createPlayer();
        this.player.loop = true;
        this.player.preload = 'none';
        this.player.volume = 0.18;
        this.player.src = this.source();
      }
      if (this.player.paused) {
        // Autoplay restrictions, interrupted loads and unavailable audio are nonfatal.
        void this.player.play().catch(() => {});
      }
    } catch {
      // The game remains playable in environments without media support.
    }
  }
}
