import { t } from '../../i18n';
export const DEFEAT_MESSAGES = [
  t('En DEV funcionaba.'),
  t('Fue un cambio chiquito.'),
  t('¿Quién tocó producción?'),
  t('El Excel tenía columnas nuevas.'),
  t('Nadie mencionó ese requerimiento.'),
  t('Revisemos los logs.'),
  t('Debe ser caché.'),
];
export const EASTER_EGGS: Record<string, string> = {
  bug: t('IT WORKS ON MY MACHINE'),
  scope: t('OUT OF SCOPE'),
  excel: t("PLEASE DON'T SEND ANOTHER XLSX"),
  integration: t('API 200 OK ♥'),
};
export const PHASES = [
  { name: t('GREEN'), message: t('GO LIVE STARTED'), color: '#beff63' },
  { name: t('YELLOW'), message: t('USERS ARE LOGGING IN...'), color: '#ffcf62' },
  { name: t('RED'), message: t('PRODUCTION IS ON FIRE'), color: '#ff657f' },
] as const;
