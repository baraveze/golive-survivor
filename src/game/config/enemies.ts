import { t } from '../../i18n';
export interface EnemyDefinition {
  id: string;
  label: string;
  glyph: string;
  hp: number;
  speed: number;
  damage: number;
  score: number;
  size: number;
  spawnAfterSeconds: number;
  color: number;
  description: string;
  tip: string;
}
export const ENEMIES: EnemyDefinition[] = [
  {
    id: 'bug',
    description: t('Pequeño, rápido y convencido de que en DEV funcionaba.'),
    tip: t('Mantené distancia: un solo Fix alcanza para resolverlo.'),
    label: t('BUG'),
    glyph: '!',
    hp: 1,
    speed: 100,
    damage: 10,
    score: 20,
    size: 15,
    spawnAfterSeconds: 0,
    color: 0xbeff63,
  },
  {
    id: 'flow',
    description: t('La automatización que eligió fallar justo cuando entró el cliente.'),
    tip: t('Necesita dos Fixes. Seguí moviéndote mientras se resuelve.'),
    label: t('FLOW FAILED'),
    glyph: 'ϟ',
    hp: 2,
    speed: 76,
    damage: 15,
    score: 35,
    size: 20,
    spawnAfterSeconds: 7,
    color: 0xffcf62,
  },
  {
    id: 'role',
    description: t('El permiso que nadie pidió. El bloqueo que todos sufren.'),
    tip: t('Es el más rápido del grupo. No lo dejes acercarse.'),
    label: t('MISSING ROLE'),
    glyph: '⊘',
    hp: 1,
    speed: 125,
    damage: 12,
    score: 30,
    size: 16,
    spawnAfterSeconds: 15,
    color: 0xb39aff,
  },
  {
    id: 'scope',
    description: t('“Ya que estamos, ¿podemos agregar una cosita más?”'),
    tip: t('Es lento, pero pega fuerte. Rodealo y cuidá tu espacio.'),
    label: t('SCOPE CREEP'),
    glyph: '+',
    hp: 3,
    speed: 56,
    damage: 22,
    score: 60,
    size: 27,
    spawnAfterSeconds: 25,
    color: 0xffa466,
  },
  {
    id: 'excel',
    description: t('70.000 filas, columnas nuevas y un archivo llamado final_final_v8.xlsx.'),
    tip: t('Resiste varios Fixes. Si viene acompañado, prepará el Hotfix.'),
    label: t('EXCEL 70K ROWS'),
    glyph: 'X',
    hp: 4,
    speed: 49,
    damage: 25,
    score: 90,
    size: 30,
    spawnAfterSeconds: 35,
    color: 0x55e7aa,
  },
  {
    id: 'integration',
    description: t('SAP, LEGACY, ERP o API. Siempre hay otro sistema en el medio.'),
    tip: t('Tiene mucha resistencia. Evitá quedar encerrado entre integraciones.'),
    label: t('INTEGRATION'),
    glyph: '↔',
    hp: 6,
    speed: 44,
    damage: 28,
    score: 120,
    size: 34,
    spawnAfterSeconds: 45,
    color: 0x5bcaff,
  },
];
export const BOSS: EnemyDefinition = {
  id: 'boss',
  description: t('El incidente que convierte el Go Live en una llamada con todo el equipo.'),
  tip: t('Combiná Fixes y Hotfix. Resolverlo suma un gran premio, pero podés ganar sobreviviendo.'),
  label: t('PRODUCTION ISSUE'),
  glyph: '!!',
  hp: 25,
  speed: 45,
  damage: 35,
  score: 500,
  size: 56,
  spawnAfterSeconds: 65,
  color: 0xff657f,
};
