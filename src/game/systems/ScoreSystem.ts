import { BALANCE } from '../config/balance';

export class ScoreSystem {
  private killPoints = 0;
  private bonus = 0;
  private seconds = 0;
  private streak = 0;
  private lastKill = -Infinity;
  issuesResolved = 0;
  maxCombo = 1;
  bossResolved = false;

  get score(): number {
    return this.killPoints + Math.floor(this.seconds) * BALANCE.pointsPerSecond + this.bonus;
  }
  update(seconds: number): void {
    this.seconds = Math.min(BALANCE.gameDurationSeconds, Math.max(0, seconds));
  }
  combo(now: number): number {
    if (now - this.lastKill >= BALANCE.comboWindowMs) return 1;
    return BALANCE.comboMultipliers[Math.max(0, Math.min(this.streak - 1, 5))];
  }
  resolve(base: number, now: number, boss = false): number {
    this.streak = now - this.lastKill < BALANCE.comboWindowMs ? this.streak + 1 : 1;
    this.lastKill = now;
    const multiplier = this.combo(now);
    const points = Math.round(base * multiplier);
    this.killPoints += points;
    this.issuesResolved++;
    this.maxCombo = Math.max(this.maxCombo, multiplier);
    this.bossResolved ||= boss;
    return points;
  }
  survive(): void {
    this.bonus = BALANCE.survivalBonus;
  }
}
