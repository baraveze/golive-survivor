import { t } from '../../i18n';
export const GAME_CONFIG = {
  title: 'GO LIVE SURVIVOR',
  get subtitle() { return t('Sobreviví 90 segundos. Salvá el Go Live.'); },
  get teamName() { return t('CRM TEAM'); },
  version: __APP_VERSION__,
};
