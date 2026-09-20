import { storage } from '../utils/storage';
import { catalog } from './catalog';

export type Language = 'es' | 'en';
export function resolveLanguage(value: string | null): Language {
  return value === 'en' ? 'en' : 'es';
}
export const language = resolveLanguage(storage.get('gls:language'));
export const locale = language === 'es' ? 'es-AR' : 'en-US';
export function t(source: string, target: Language = language): string {
  return catalog[source]?.[target === 'es' ? 0 : 1] ?? source;
}
