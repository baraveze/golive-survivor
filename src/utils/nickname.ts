export function sanitizeNickname(value: string): string {
  return value
    .normalize('NFC')
    .replace(/[^\p{L}\p{N} _-]/gu, '')
    .trim()
    .slice(0, 18);
}
export function validateNickname(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < 2) return 'Ingresá al menos 2 caracteres.';
  if (trimmed.length > 18) return 'Usá hasta 18 caracteres.';
  if (!/^[\p{L}\p{N} _-]+$/u.test(trimmed)) return 'Solo letras, números, espacios, _ y -.';
  return null;
}
