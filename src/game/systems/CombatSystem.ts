import { BALANCE } from '../config/balance';
import type { Enemy } from '../entities/Enemy';

export function nearestEnemy(x: number, y: number, enemies: Enemy[]): Enemy | undefined {
  let nearest: Enemy | undefined;
  let distance = BALANCE.attackRange ** 2;
  for (const enemy of enemies) {
    if (!enemy.active) continue;
    const d = (enemy.x - x) ** 2 + (enemy.y - y) ** 2;
    if (d < distance) {
      distance = d;
      nearest = enemy;
    }
  }
  return nearest;
}
/** Segment-circle collision prevents fast fixes tunneling through small enemies. */
export function segmentHitsCircle(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  radius: number,
): boolean {
  const dx = bx - ax,
    dy = by - ay;
  const t = Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / (dx * dx + dy * dy || 1)));
  return (ax + t * dx - cx) ** 2 + (ay + t * dy - cy) ** 2 <= radius ** 2;
}
