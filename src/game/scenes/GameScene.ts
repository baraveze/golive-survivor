import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { PHASES, EASTER_EGGS } from '../config/messages';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { ScoreSystem } from '../systems/ScoreSystem';
import { EnemySpawner } from '../systems/EnemySpawner';
import { nearestEnemy, segmentHitsCircle } from '../systems/CombatSystem';
import { phaseAt } from '../systems/DifficultySystem';
import type { AudioService } from '../../services/AudioService';
import type { ScoreSubmission } from '../../services/score/ScoreRepository';

export interface HudState {
  stability: number;
  seconds: number;
  score: number;
  combo: number;
  cooldown: number;
  phase: number;
  bossHp: number | null;
  paused: boolean;
}
export interface GameCallbacks {
  audio: AudioService;
  hud: (state: HudState) => void;
  finish: (result: Omit<ScoreSubmission, 'player_name'>) => void;
}

export class GameScene extends Phaser.Scene {
  player!: Player;
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  scoring = new ScoreSystem();
  elapsed = 0;
  private spawner!: EnemySpawner;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private lastShot = 0;
  private hotfixAt = 0;
  private phase = -1;
  private ended = false;
  private paused = false;
  private activeRun = false;
  private announcement?: Phaser.GameObjects.Text;
  private grid!: Phaser.GameObjects.Graphics;
  constructor(private callbacks: GameCallbacks) {
    super('arena');
  }
  create(): void {
    this.grid = this.add.graphics();
    this.grid.lineStyle(1, 0x34445e, 0.17);
    for (let x = 0; x < BALANCE.width; x += 40) this.grid.lineBetween(x, 0, x, BALANCE.height);
    for (let y = 0; y < BALANCE.height; y += 40) this.grid.lineBetween(0, y, BALANCE.width, y);
    this.grid
      .lineStyle(1, 0x73edff, 0.12)
      .strokeRect(20, 20, BALANCE.width - 40, BALANCE.height - 40);
    this.add.text(40, BALANCE.height - 37, 'PROD / eu-west / do-not-touch', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#34445e',
    });
    this.keys = this.input.keyboard!.addKeys(
      'W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ESC',
      false,
    ) as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.enabled = false;
    this.input.keyboard!.on('keydown-SPACE', (event: KeyboardEvent) => {
      if (!event.repeat) this.hotfix();
    });
    this.input.keyboard!.on('keydown-ESC', (event: KeyboardEvent) => {
      if (!event.repeat) this.togglePause();
    });
    this.game.events.on(Phaser.Core.Events.BLUR, this.pauseOnBlur, this);
    const visibility = () => {
      if (document.hidden) this.pauseOnBlur();
    };
    document.addEventListener('visibilitychange', visibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, this.pauseOnBlur, this);
      document.removeEventListener('visibilitychange', visibility);
    });
    this.drawIdle();
  }
  private drawIdle(): void {
    this.player = new Player(this, BALANCE.width * 0.52, BALANCE.height * 0.47);
  }
  private clearRunObjects(): void {
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.children.list
      .filter((child) => child !== this.grid && child.type !== 'Text')
      .forEach((child) => child.destroy());
    // Remove transient labels from the previous run while preserving the arena footer.
    this.children.list
      .filter(
        (child) =>
          child instanceof Phaser.GameObjects.Text &&
          child.text !== 'PROD / eu-west / do-not-touch',
      )
      .forEach((child) => child.destroy());
    this.enemies = [];
    this.projectiles = [];
    this.announcement = undefined;
  }
  cancelRun(): void {
    if (!this.activeRun || this.ended) return;
    this.activeRun = false;
    this.ended = true;
    this.paused = false;
    this.input.keyboard!.enabled = false;
    this.input.keyboard!.removeCapture('UP,DOWN,LEFT,RIGHT,SPACE');
    this.input.keyboard!.resetKeys();
    this.clearRunObjects();
    this.time.paused = false;
    this.tweens.timeScale = 1;
    this.drawIdle();
  }
  startRun(): void {
    this.clearRunObjects();
    this.time.paused = false;
    this.tweens.timeScale = 1;
    this.scoring = new ScoreSystem();
    this.elapsed = 0;
    this.lastShot = -BALANCE.attackIntervalMs;
    this.hotfixAt = 0;
    this.phase = -1;
    this.ended = false;
    this.paused = false;
    this.activeRun = true;
    this.announcement = undefined;
    this.player = new Player(this, BALANCE.width / 2, BALANCE.height / 2);
    this.spawner = new EnemySpawner(this);
    this.input.keyboard!.enabled = true;
    this.input.keyboard!.addCapture('UP,DOWN,LEFT,RIGHT,SPACE');
    this.input.keyboard!.resetKeys();
    this.publishHud();
  }
  private pauseOnBlur(): void {
    if (this.activeRun && !this.ended && !this.paused) this.togglePause();
  }
  togglePause(): void {
    if (!this.activeRun || this.ended) return;
    this.paused = !this.paused;
    this.tweens.timeScale = this.paused ? 0 : 1;
    this.time.paused = this.paused;
    this.input.keyboard!.resetKeys();
    this.publishHud();
  }
  update(_time: number, delta: number): void {
    if (!this.activeRun || this.ended) return;
    if (this.paused) return;
    // Clamp long frames: background tabs cannot skip combat or award free survival.
    const dt = Math.min(delta, 50) / 1000;
    this.elapsed = Math.min(BALANCE.gameDurationSeconds * 1000, this.elapsed + dt * 1000);
    const seconds = this.elapsed / 1000;
    this.scoring.update(seconds);
    if (seconds >= BALANCE.gameDurationSeconds) {
      this.finish(true);
      return;
    }
    const phase = phaseAt(seconds);
    if (phase !== this.phase) {
      this.phase = phase;
      this.announce(PHASES[phase].message, PHASES[phase].color);
    }
    const dx =
      Number(this.keys.D.isDown || this.keys.RIGHT.isDown) -
      Number(this.keys.A.isDown || this.keys.LEFT.isDown);
    const dy =
      Number(this.keys.S.isDown || this.keys.DOWN.isDown) -
      Number(this.keys.W.isDown || this.keys.UP.isDown);
    this.player.move(dx, dy, dt, this.elapsed);
    this.spawner.update(
      this.elapsed,
      this.enemies.length,
      (enemy) => this.enemies.push(enemy),
      () => {
        this.announce('⚠ PRODUCTION ISSUE ⚠', '#ff657f');
        this.callbacks.audio.play('warning');
        this.cameras.main.flash(240, 110, 20, 45, false);
      },
    );
    if (
      this.elapsed - this.lastShot >= BALANCE.attackIntervalMs &&
      this.projectiles.length < BALANCE.maxProjectiles
    ) {
      const target = nearestEnemy(this.player.x, this.player.y, this.enemies);
      if (target) {
        this.projectiles.push(
          new Projectile(
            this,
            this.player.x,
            this.player.y,
            Math.atan2(target.y - this.player.y, target.x - this.player.x),
          ),
        );
        this.lastShot = this.elapsed;
        this.callbacks.audio.play('shot');
      }
    }
    for (const projectile of this.projectiles) {
      const x = projectile.x,
        y = projectile.y;
      projectile.step(dt);
      for (const enemy of this.enemies) {
        if (
          enemy.active &&
          segmentHitsCircle(
            x,
            y,
            projectile.x,
            projectile.y,
            enemy.x,
            enemy.y,
            enemy.definition.size + 3,
          )
        ) {
          this.damageEnemy(enemy, 1);
          projectile.destroy();
          break;
        }
      }
      if (projectile.active && projectile.age > BALANCE.projectileLifeMs) projectile.destroy();
    }
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      enemy.chase(this.player.x, this.player.y, dt);
      if (
        Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) <
          enemy.definition.size + BALANCE.playerRadius &&
        this.player.hit(enemy.definition.damage, this.elapsed)
      ) {
        this.callbacks.audio.play('hit');
        this.cameras.main.shake(100, 0.003);
        this.cameras.main.flash(100, 100, 18, 35, false);
        const angle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
        enemy.x += Math.cos(angle) * 90;
        enemy.y += Math.sin(angle) * 90;
        if (this.player.stability <= 0) {
          this.finish(false);
          return;
        }
      }
    }
    this.enemies = this.enemies.filter((enemy) => enemy.active);
    this.projectiles = this.projectiles.filter((projectile) => projectile.active);
    this.publishHud();
  }
  hotfix(): void {
    if (!this.activeRun || this.ended || this.paused || this.elapsed < this.hotfixAt) return;
    this.hotfixAt = this.elapsed + BALANCE.hotfixCooldownMs;
    const pulse = this.add
      .circle(this.player.x, this.player.y, 12, 0x73edff, 0.14)
      .setStrokeStyle(3, 0x73edff)
      .setDepth(6);
    this.tweens.add({
      targets: pulse,
      radius: BALANCE.hotfixRadius,
      alpha: 0,
      duration: 430,
      ease: 'Cubic.Out',
      onComplete: () => pulse.destroy(),
    });
    this.burst(this.player.x, this.player.y, 0x73edff, 20, 150);
    this.cameras.main.shake(180, 0.004);
    this.callbacks.audio.play('hotfix');
    for (const enemy of this.enemies) {
      if (
        enemy.active &&
        Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) <=
          BALANCE.hotfixRadius + enemy.definition.size
      )
        this.damageEnemy(enemy, BALANCE.hotfixDamage);
    }
  }
  private damageEnemy(enemy: Enemy, damage: number): void {
    enemy.hp -= damage;
    if (enemy.hp > 0) {
      enemy.alpha = 0.4;
      this.tweens.add({ targets: enemy, alpha: 1, duration: 110 });
      return;
    }
    const points = this.scoring.resolve(
      enemy.definition.score,
      this.elapsed,
      enemy.definition.id === 'boss',
    );
    this.burst(enemy.x, enemy.y, enemy.definition.color, 7);
    this.floatingText(enemy.x, enemy.y - 25, `+${points}`, '#beff63');
    const egg = EASTER_EGGS[enemy.definition.id];
    if (egg && Math.random() < (enemy.definition.id === 'bug' ? 0.03 : 0.22))
      this.floatingText(enemy.x, enemy.y - 48, egg, '#9aaac2', 10);
    this.callbacks.audio.play('kill');
    enemy.destroy();
  }
  private burst(x: number, y: number, color: number, count: number, distance = 48): void {
    for (let i = 0; i < count; i++) {
      const particle = this.add.rectangle(x, y, 4, 4, color).setDepth(8);
      const angle = Math.random() * Math.PI * 2;
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        angle: 100,
        duration: 400 + Math.random() * 200,
        onComplete: () => particle.destroy(),
      });
    }
  }
  private floatingText(x: number, y: number, text: string, color: string, size = 16): void {
    const label = this.add
      .text(x, y, text, {
        fontFamily: 'monospace',
        fontSize: `${size}px`,
        color,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(9);
    this.tweens.add({
      targets: label,
      y: y - 35,
      alpha: 0,
      duration: 850,
      onComplete: () => label.destroy(),
    });
  }
  private announce(text: string, color: string): void {
    if (this.announcement) {
      this.tweens.killTweensOf(this.announcement);
      this.announcement.destroy();
    }
    this.announcement = this.add
      .text(BALANCE.width / 2, 100, text, {
        fontFamily: 'monospace',
        fontSize: '23px',
        fontStyle: 'bold',
        color,
        backgroundColor: '#080e18',
        padding: { x: 24, y: 14 },
      })
      .setOrigin(0.5)
      .setDepth(10);
    const label = this.announcement;
    this.tweens.add({
      targets: label,
      alpha: 0,
      delay: 2100,
      duration: 500,
      onComplete: () => {
        label.destroy();
        if (this.announcement === label) this.announcement = undefined;
      },
    });
  }
  private publishHud(): void {
    const boss = this.enemies.find((enemy) => enemy.active && enemy.definition.id === 'boss');
    this.callbacks.hud({
      stability: this.player.stability,
      seconds: this.elapsed / 1000,
      score: this.scoring.score,
      combo: this.scoring.combo(this.elapsed),
      cooldown: Math.max(0, (this.hotfixAt - this.elapsed) / 1000),
      phase: Math.max(0, this.phase),
      bossHp: boss ? boss.hp / boss.definition.hp : null,
      paused: this.paused,
    });
  }
  private finish(survived: boolean): void {
    if (this.ended) return;
    this.ended = true;
    this.input.keyboard!.enabled = false;
    this.input.keyboard!.removeCapture('UP,DOWN,LEFT,RIGHT,SPACE');
    if (survived) {
      this.scoring.survive();
      for (let i = 0; i < 12; i++)
        this.burst(
          Phaser.Math.Between(100, 1180),
          Phaser.Math.Between(100, 620),
          i % 2 ? 0xbeff63 : 0x73edff,
          10,
          90,
        );
    }
    this.callbacks.audio.play(survived ? 'victory' : 'down');
    this.publishHud();
    this.callbacks.finish({
      score: this.scoring.score,
      survived_seconds: Math.floor(this.elapsed / 1000),
      issues_resolved: this.scoring.issuesResolved,
      max_combo: this.scoring.maxCombo,
      boss_resolved: this.scoring.bossResolved,
      result: survived ? 'survived' : 'down',
    });
  }
}
