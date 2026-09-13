export const DEFEAT_MESSAGES = [
  'En DEV funcionaba.',
  'Fue un cambio chiquito.',
  '¿Quién tocó producción?',
  'El Excel tenía columnas nuevas.',
  'Nadie mencionó ese requerimiento.',
  'Revisemos los logs.',
  'Debe ser caché.',
];
export const EASTER_EGGS: Record<string, string> = {
  bug: 'IT WORKS ON MY MACHINE',
  scope: 'OUT OF SCOPE',
  excel: "PLEASE DON'T SEND ANOTHER XLSX",
  integration: 'API 200 OK ♥',
};
export const PHASES = [
  { name: 'GREEN', message: 'GO LIVE STARTED', color: '#beff63' },
  { name: 'YELLOW', message: 'USERS ARE LOGGING IN...', color: '#ffcf62' },
  { name: 'RED', message: 'PRODUCTION IS ON FIRE', color: '#ff657f' },
] as const;
