import { afterEach, describe, expect, it, vi } from 'vitest';
import { createUuid } from '../src/utils/uuid';
import { LocalScoreRepository } from '../src/services/score/LocalScoreRepository';
import { storage } from '../src/utils/storage';

const browserCrypto = globalThis.crypto;
const v4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
afterEach(() => vi.unstubAllGlobals());

describe('IDs on mobile HTTP origins', () => {
  it('uses the native UUID when available', () => {
    const id = 'e1bd6d4d-6f26-4f43-b63d-d8cd9dc6bce7';
    const randomUUID = vi.fn(() => id);
    vi.stubGlobal('crypto', { randomUUID });
    expect(createUuid()).toBe(id);
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  it('generates distinct valid v4 UUIDs without randomUUID', () => {
    vi.stubGlobal('crypto', { getRandomValues: browserCrypto.getRandomValues.bind(browserCrypto) });
    const ids = Array.from({ length: 100 }, createUuid);
    expect(new Set(ids).size).toBe(100);
    for (const id of ids) expect(id).toMatch(v4);
  });

  it('creates an identity and saves scores on HTTP, preserving the identity across reloads', async () => {
    vi.stubGlobal('crypto', { getRandomValues: browserCrypto.getRandomValues.bind(browserCrypto) });
    storage.set('gls:player-id', '');
    storage.set('gls:scores', '[]');
    const repo = new LocalScoreRepository();
    expect(repo.userId).toMatch(v4);
    await repo.submitScore({
      player_name: 'Phone',
      score: 100,
      survived_seconds: 10,
      issues_resolved: 3,
      max_combo: 1,
      boss_resolved: false,
      result: 'down',
    });
    const next = new LocalScoreRepository();
    expect(next.userId).toBe(repo.userId);
    expect(await next.getPersonalBest()).toBe(100);
    const rows = await next.getWeeklyLeaderboard();
    expect(rows[0].id).toMatch(v4);
    expect(rows[0].id).not.toBe(repo.userId);
  });

  it('keeps existing player identities unchanged', () => {
    storage.set('gls:player-id', 'existing-player');
    vi.stubGlobal('crypto', {});
    expect(new LocalScoreRepository().userId).toBe('existing-player');
  });
});
