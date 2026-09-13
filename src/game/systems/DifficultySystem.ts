import { BALANCE } from '../config/balance';
import { ENEMIES } from '../config/enemies';
export function phaseAt(seconds: number): number {
  return seconds < 30 ? 0 : seconds < 60 ? 1 : 2;
}
export function spawnInterval(seconds: number): number {
  return (
    BALANCE.spawnStartMs +
    (BALANCE.spawnEndMs - BALANCE.spawnStartMs) *
      Math.min(1, Math.max(0, seconds / BALANCE.gameDurationSeconds))
  );
}
export function availableEnemies(seconds: number) {
  return ENEMIES.filter((enemy) => enemy.spawnAfterSeconds <= seconds);
}
