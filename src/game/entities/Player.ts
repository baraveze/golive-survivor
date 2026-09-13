import Phaser from 'phaser';
import { BALANCE } from '../config/balance';

export class Player extends Phaser.GameObjects.Container {
  stability: number = BALANCE.playerMaxStability;
  invulnerableUntil = 0;
  private bodyArt: Phaser.GameObjects.Container;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    const shadow = scene.add.ellipse(0, 22, 44, 13, 0x000000, 0.4);
    const halo = scene.add.circle(0, 0, 30, 0x73edff, 0.04).setStrokeStyle(1, 0x73edff, 0.2);
    const art = scene.add.graphics();
    art.fillStyle(0x73edff).fillRoundedRect(-15, -19, 30, 29, 5);
    art.fillStyle(0x15233c).fillRoundedRect(-11, -12, 22, 12, 3);
    art.fillStyle(0xffffff).fillRect(-7, -8, 4, 4).fillRect(3, -8, 4, 4);
    art.fillStyle(0x3ba3ba).fillRect(-11, 12, 8, 10).fillRect(3, 12, 8, 10);
    art.fillStyle(0xbeff63).fillRect(-4, 3, 8, 4);
    art.lineStyle(2, 0x73edff).lineBetween(0, -19, 0, -26);
    art.fillStyle(0xbeff63).fillCircle(0, -28, 3);
    this.bodyArt = scene.add.container(0, 0, [art]);
    this.add([shadow, halo, this.bodyArt]);
    this.setDepth(5);
    scene.add.existing(this);
  }
  move(dx: number, dy: number, dt: number, now: number): void {
    const length = Math.hypot(dx, dy) || 1;
    this.x = Phaser.Math.Clamp(
      this.x + (dx / length) * BALANCE.playerMoveSpeed * dt,
      30,
      BALANCE.width - 30,
    );
    this.y = Phaser.Math.Clamp(
      this.y + (dy / length) * BALANCE.playerMoveSpeed * dt,
      42,
      BALANCE.height - 32,
    );
    this.bodyArt.y = dx || dy ? Math.sin(now / 65) * 2 : Math.sin(now / 220);
    this.alpha = now < this.invulnerableUntil ? (Math.floor(now / 70) % 2 ? 0.35 : 1) : 1;
  }
  hit(damage: number, now: number): boolean {
    if (now < this.invulnerableUntil) return false;
    this.stability = Math.max(0, this.stability - damage);
    this.invulnerableUntil = now + BALANCE.invulnerabilityAfterHitMs;
    return true;
  }
}
