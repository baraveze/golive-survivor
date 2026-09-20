import { t } from '../../i18n';
export function defeatMessages() { return [
  t('En DEV funcionaba.'),
  t('Fue un cambio chiquito.'),
  t('¿Quién tocó producción?'),
  t('El Excel tenía columnas nuevas.'),
  t('Nadie mencionó ese requerimiento.'),
  t('Revisemos los logs.'),
  t('Debe ser caché.'),
]; }
export const EASTER_EGGS: Record<string, string> = {
  get bug() { return t('IT WORKS ON MY MACHINE'); },
  get scope() { return t('OUT OF SCOPE'); },
  get excel() { return t("PLEASE DON'T SEND ANOTHER XLSX"); },
  get integration() { return t('API 200 OK ♥'); },
};
export const PHASES = [
  { get name() { return t('GREEN'); }, get message() { return t('GO LIVE STARTED'); }, color: '#beff63' },
  { get name() { return t('YELLOW'); }, get message() { return t('USERS ARE LOGGING IN...'); }, color: '#ffcf62' },
  { get name() { return t('RED'); }, get message() { return t('PRODUCTION IS ON FIRE'); }, color: '#ff657f' },
] as const;
