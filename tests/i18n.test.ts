import { afterEach, describe, expect, it, vi } from 'vitest';
import { catalog } from '../src/i18n/catalog';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('language preference and translated game content', () => {
  it.each(['es', 'en'])('loads the saved %s language throughout the game', async (language) => {
    vi.stubGlobal('localStorage', { getItem: () => language });
    const i18n = await import('../src/i18n');
    const { ENEMIES, BOSS } = await import('../src/game/config/enemies');
    const { PHASES, DEFEAT_MESSAGES } = await import('../src/game/config/messages');
    const { validateNickname } = await import('../src/utils/nickname');
    expect(i18n.language).toBe(language);
    expect(ENEMIES[0].label).toBe(catalog.BUG[language === 'es' ? 0 : 1]);
    expect(BOSS.label).toBe(language === 'es' ? 'INCIDENTE EN PRODUCCIÓN' : 'PRODUCTION ISSUE');
    expect(PHASES[0].name).toBe(language === 'es' ? 'VERDE' : 'GREEN');
    expect(DEFEAT_MESSAGES[0]).toBe(
      language === 'es' ? 'En desarrollo funcionaba.' : 'It worked in development.',
    );
    expect(validateNickname('')).toBe(
      language === 'es' ? 'Ingresá al menos 2 caracteres.' : 'Enter at least 2 characters.',
    );
  });

  it('defaults to Spanish when storage is unavailable or the preference is unsupported', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
    });
    const { language, resolveLanguage } = await import('../src/i18n');
    expect(language).toBe('es');
    expect(resolveLanguage('fr')).toBe('es');
    expect(resolveLanguage(null)).toBe('es');
  });

  it('ships nonempty plain-text translations for both languages', () => {
    for (const translations of Object.values(catalog)) {
      expect(translations).toHaveLength(2);
      for (const text of translations) {
        expect(text.trim()).not.toBe('');
        expect(text).not.toMatch(/[<>]/);
      }
    }
  });
});
