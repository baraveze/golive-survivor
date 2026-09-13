import { storage } from '../../utils/storage';
import { isThisWeek } from '../../utils/dates';
import {
  bestPerPlayer,
  validateSubmission,
  type LeaderboardEntry,
  type ScoreRepository,
  type ScoreSubmission,
} from './ScoreRepository';
export class LocalScoreRepository implements ScoreRepository {
  readonly mode = 'local' as const;
  readonly userId: string;
  constructor() {
    this.userId = storage.get('gls:player-id') || crypto.randomUUID();
    storage.set('gls:player-id', this.userId);
  }
  private read(): LeaderboardEntry[] {
    try {
      const rows: unknown = JSON.parse(storage.get('gls:scores') || '[]');
      if (!Array.isArray(rows)) return [];
      return rows.filter((r): r is LeaderboardEntry => {
        try {
          validateSubmission(r);
          return (
            typeof r.id === 'string' &&
            typeof r.user_id === 'string' &&
            Number.isFinite(Date.parse(r.created_at))
          );
        } catch {
          return false;
        }
      });
    } catch {
      return [];
    }
  }
  async submitScore(score: ScoreSubmission): Promise<void> {
    validateSubmission(score);
    const entries = this.read();
    entries.push({
      ...score,
      id: crypto.randomUUID(),
      user_id: this.userId,
      created_at: new Date().toISOString(),
    });
    // Preserve historic bests as well as recent runs in the bounded local store.
    const best = bestPerPlayer(entries);
    const recent = entries.slice(-400);
    const unique = [...new Map([...best, ...recent].map((row) => [row.id, row])).values()];
    storage.set('gls:scores', JSON.stringify(unique));
  }
  async getWeeklyLeaderboard() {
    return bestPerPlayer(this.read().filter((row) => isThisWeek(row.created_at))).slice(0, 10);
  }
  async getAllTimeLeaderboard() {
    return bestPerPlayer(this.read()).slice(0, 10);
  }
  async getPersonalBest() {
    return bestPerPlayer(this.read()).find((row) => row.user_id === this.userId)?.score ?? null;
  }
  async getWeeklyRank() {
    const rank = bestPerPlayer(this.read().filter((row) => isThisWeek(row.created_at))).findIndex(
      (row) => row.user_id === this.userId,
    );
    return rank < 0 ? null : rank + 1;
  }
}
