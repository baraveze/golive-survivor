import Phaser from 'phaser';
import type { EnemyDefinition } from '../config/enemies';
export class Enemy extends Phaser.GameObjects.Container {
  hp: number;
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly definition: EnemyDefinition,
  ) {
    super(scene, x, y);
    this.hp = definition.hp;
    const s = definition.size;
    const shape = scene.add.graphics();
    shape.fillStyle(definition.color, 0.09).fillCircle(0, 0, s + 9);
    shape.fillStyle(0x111e2c).fillRoundedRect(-s, -s, s * 2, s * 2, 5);
    shape.lineStyle(2, definition.color, 0.85).strokeRoundedRect(-s, -s, s * 2, s * 2, 5);
    const icon = scene.add
      .text(0, -1, definition.glyph, {
        fontFamily: 'monospace',
        fontSize: `${s + 6}px`,
        color: `#${definition.color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const label = scene.add
      .text(0, s + 13, definition.label, {
        fontFamily: 'monospace',
        fontSize: definition.id === 'boss' ? '14px' : '10px',
        color: '#b6c4d7',
        backgroundColor: '#080e18',
      })
      .setOrigin(0.5);
    this.add([shape, icon, label]);
    if (definition.id === 'integration') {
      this.add(
        scene.add
          .text(0, s + 26, Phaser.Utils.Array.GetRandom(['SAP', 'LEGACY', 'ERP', 'API']), {
            fontFamily: 'monospace',
            fontSize: '9px',
            color: '#5bcaff',
          })
          .setOrigin(0.5),
      );
    }
    this.setDepth(3);
    scene.add.existing(this);
  }
  chase(x: number, y: number, dt: number): void {
    const angle = Math.atan2(y - this.y, x - this.x);
    this.x += Math.cos(angle) * this.definition.speed * dt;
    this.y += Math.sin(angle) * this.definition.speed * dt;
  }
}
