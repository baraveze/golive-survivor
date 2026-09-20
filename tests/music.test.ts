import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MusicService } from '../src/services/MusicService';
import { storage } from '../src/utils/storage';

function setup() {
  const player = {
    src: '',
    paused: true,
    loop: false,
    volume: 1,
    preload: '',
    play: vi.fn(async function (this: { paused: boolean }) {
      this.paused = false;
    }),
    pause: vi.fn(function (this: { paused: boolean }) {
      this.paused = true;
    }),
  };
  const create = vi.fn(() => player as unknown as HTMLAudioElement);
  return { music: new MusicService(create), player, create };
}

beforeEach(() => storage.set('gls:music', 'on'));

describe('background music', () => {
  it('waits for interaction and reuses one looping player when switching tracks', () => {
    const { music, player, create } = setup();
    music.setScene('home');
    expect(create).not.toHaveBeenCalled();
    music.unlock();
    expect(player.src).toContain('dream-culture.mp3');
    expect(player.loop).toBe(true);
    expect(player.volume).toBeLessThan(0.25);
    music.setScene('game');
    expect(player.src).toContain('bit-quest.mp3');
    music.setScene('home');
    expect(player.src).toContain('dream-culture.mp3');
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('persists music off and leaves it off across screen changes and new sessions', () => {
    const { music, player } = setup();
    music.unlock();
    music.setEnabled(false);
    expect(player.paused).toBe(true);
    music.setScene('game');
    music.unlock();
    expect(player.paused).toBe(true);
    const next = setup();
    next.music.unlock();
    expect(next.music.enabled).toBe(false);
    expect(next.create).not.toHaveBeenCalled();
  });

  it('respects master mute without changing the music preference', () => {
    const { music, player } = setup();
    music.unlock();
    music.setMuted(true);
    music.setScene('game');
    expect(player.paused).toBe(true);
    expect(music.enabled).toBe(true);
    music.setMuted(false);
    expect(player.paused).toBe(false);
  });

  it('stays paused when returning to a paused game, and resumes only on request', () => {
    const { music, player } = setup();
    music.setScene('game');
    music.unlock();
    music.setPaused(true);
    music.setHidden(true);
    music.setHidden(false);
    music.unlock();
    expect(player.paused).toBe(true);
    music.setPaused(false);
    expect(player.paused).toBe(false);
    music.setHidden(true);
    music.setEnabled(false);
    music.setHidden(false);
    expect(player.paused).toBe(true);
  });

  it('retries blocked playback on a subsequent interaction without rejecting', async () => {
    const { music, player } = setup();
    player.play.mockRejectedValueOnce(new Error('Autoplay blocked'));
    music.unlock();
    await Promise.resolve();
    music.unlock();
    expect(player.play).toHaveBeenCalledTimes(2);
    expect(player.paused).toBe(false);
  });
});
