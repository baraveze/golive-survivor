import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
export class Projectile extends Phaser.GameObjects.Container {
  readonly vx: number;
  readonly vy: number;
  age = 0;
  constructor(scene: Phaser.Scene, x: number, y: number, angle: number) {
    super(scene, x, y);
    this.vx = Math.cos(angle) * BALANCE.projectileSpeed;
    this.vy = Math.sin(angle) * BALANCE.projectileSpeed;
    this.add(scene.add.rectangle(-6, 0, 21, 4, 0x73edff, 0.22));
    this.add(scene.add.rectangle(0, 0, 12, 4, 0xc4faff));
    this.rotation = angle;
    this.setDepth(4);
    scene.add.existing(this);
  }
  step(dt: number): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.age += dt * 1000;
  }
}
