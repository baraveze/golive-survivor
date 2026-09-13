import { BALANCE } from '../../game/config/balance';
import { validateNickname } from '../../utils/nickname';
export interface ScoreSubmission {
  player_name: string;
  score: number;
  survived_seconds: number;
  issues_resolved: number;
  max_combo: number;
  boss_resolved: boolean;
  result: 'survived' | 'down';
}
export interface LeaderboardEntry extends ScoreSubmission {
  id: string;
  user_id: string;
  created_at: string;
}
export interface ScoreRepository {
  readonly mode: 'local' | 'online';
  readonly userId: string;
  submitScore(score: ScoreSubmission): Promise<void>;
  getWeeklyLeaderboard(): Promise<LeaderboardEntry[]>;
  getAllTimeLeaderboard(): Promise<LeaderboardEntry[]>;
  getPersonalBest(): Promise<number | null>;
  getWeeklyRank(): Promise<number | null>;
}
export function validateSubmission(s: ScoreSubmission): void {
  const integer = (n: number, max: number) => Number.isInteger(n) && n >= 0 && n <= max;
  if (
    validateNickname(s.player_name) ||
    s.player_name !== s.player_name.trim() ||
    !integer(s.score, BALANCE.maxScore) ||
    !integer(s.survived_seconds, 90) ||
    !integer(s.issues_resolved, BALANCE.maxIssues) ||
    !BALANCE.comboMultipliers.some((n) => n === s.max_combo) ||
    typeof s.boss_resolved !== 'boolean' ||
    !['down', 'survived'].includes(s.result) ||
    (s.result === 'survived' && s.survived_seconds !== 90)
  ) {
    throw new Error('La partida contiene datos inválidos.');
  }
}
export function bestPerPlayer(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const sorted = [...entries].sort(
    (a, b) =>
      b.score - a.score || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  );
  return sorted.filter(
    (entry, index) => sorted.findIndex((other) => other.user_id === entry.user_id) === index,
  );
}
