import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { BOSS, type EnemyDefinition } from '../config/enemies';
import { Enemy } from '../entities/Enemy';
import { availableEnemies, spawnInterval } from './DifficultySystem';

export class EnemySpawner {
  private nextSpawn = 600;
  private warned = false;
  private spawnedBoss = false;
  constructor(private scene: Phaser.Scene) {}
  update(now: number, count: number, spawn: (enemy: Enemy) => void, warn: () => void): void {
    const seconds = now / 1000;
    if (!this.warned && seconds >= BALANCE.bossSpawnSecond) {
      this.warned = true;
      warn();
    }
    if (!this.spawnedBoss && seconds >= BALANCE.bossSpawnSecond + BALANCE.bossWarningSeconds) {
      this.spawnedBoss = true;
      spawn(this.create(BOSS, 0));
    }
    const bossPause =
      seconds >= BALANCE.bossSpawnSecond &&
      seconds < BALANCE.bossSpawnSecond + BALANCE.bossSpawnPauseSeconds;
    if (now >= this.nextSpawn && count < BALANCE.maxEnemies && !bossPause) {
      this.nextSpawn = now + spawnInterval(seconds);
      spawn(this.create(Phaser.Utils.Array.GetRandom(availableEnemies(seconds))));
    }
  }
  private create(def: EnemyDefinition, side = Phaser.Math.Between(0, 3)): Enemy {
    const x =
      side === 1
        ? BALANCE.width + 40
        : side === 3
          ? -40
          : Phaser.Math.Between(40, BALANCE.width - 40);
    const y =
      side === 0
        ? -60
        : side === 2
          ? BALANCE.height + 40
          : Phaser.Math.Between(40, BALANCE.height - 40);
    return new Enemy(this.scene, x, y, def);
  }
}
