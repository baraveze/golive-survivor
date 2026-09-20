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
    get description() { return t('Pequeño, rápido y convencido de que en DEV funcionaba.'); },
    get tip() { return t('Mantené distancia: un solo Fix alcanza para resolverlo.'); },
    get label() { return t('BUG'); },
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
    get description() { return t('La automatización que eligió fallar justo cuando entró el cliente.'); },
    get tip() { return t('Necesita dos Fixes. Seguí moviéndote mientras se resuelve.'); },
    get label() { return t('FLOW FAILED'); },
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
    get description() { return t('El permiso que nadie pidió. El bloqueo que todos sufren.'); },
    get tip() { return t('Es el más rápido del grupo. No lo dejes acercarse.'); },
    get label() { return t('MISSING ROLE'); },
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
    get description() { return t('“Ya que estamos, ¿podemos agregar una cosita más?”'); },
    get tip() { return t('Es lento, pero pega fuerte. Rodealo y cuidá tu espacio.'); },
    get label() { return t('SCOPE CREEP'); },
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
    get description() { return t('70.000 filas, columnas nuevas y un archivo llamado final_final_v8.xlsx.'); },
    get tip() { return t('Resiste varios Fixes. Si viene acompañado, prepará el Hotfix.'); },
    get label() { return t('EXCEL 70K ROWS'); },
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
    get description() { return t('SAP, LEGACY, ERP o API. Siempre hay otro sistema en el medio.'); },
    get tip() { return t('Tiene mucha resistencia. Evitá quedar encerrado entre integraciones.'); },
    get label() { return t('INTEGRATION'); },
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
  get description() { return t('El incidente que convierte el Go Live en una llamada con todo el equipo.'); },
  get tip() { return t('Combiná Fixes y Hotfix. Resolverlo suma un gran premio, pero podés ganar sobreviviendo.'); },
  get label() { return t('PRODUCTION ISSUE'); },
  glyph: '!!',
  hp: 25,
  speed: 45,
  damage: 35,
  score: 500,
  size: 56,
  spawnAfterSeconds: 65,
  color: 0xff657f,
};
