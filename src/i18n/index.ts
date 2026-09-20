import { storage } from '../utils/storage';
import { catalog } from './catalog';

export type Language = 'es' | 'en';
export function resolveLanguage(value: string | null): Language {
  return value === 'en' ? 'en' : 'es';
}
export let language = resolveLanguage(storage.get('gls:language'));
export let locale = language === 'es' ? 'es-AR' : 'en-US';
export function setLanguage(value: string): void {
  language = resolveLanguage(value);
  locale = language === 'es' ? 'es-AR' : 'en-US';
  storage.set('gls:language', language);
}
export function t(source: string, target: Language = language): string {
  return catalog[source]?.[target === 'es' ? 0 : 1] ?? source;
}

/** Only exact authored catalog phrases are translated; never replace substrings. */
export function translateText(text: string, from: Language): string {
  const trimmed = text.trim();
  const entry = Object.values(catalog).find((pair) => pair[from === 'es' ? 0 : 1].trim() === trimmed);
  if (!entry) return text;
  return text.replace(trimmed, entry[language === 'es' ? 0 : 1].trim());
}
