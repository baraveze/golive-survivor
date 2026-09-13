import type { SupabaseClient } from '@supabase/supabase-js';
import {
  validateSubmission,
  type LeaderboardEntry,
  type ScoreRepository,
  type ScoreSubmission,
} from './ScoreRepository';
export class SupabaseScoreRepository implements ScoreRepository {
  readonly mode = 'online' as const;
  constructor(
    private client: SupabaseClient,
    readonly userId: string,
  ) {}
  async submitScore(score: ScoreSubmission) {
    validateSubmission(score);
    const { error } = await this.client.from('scores').insert({ ...score, user_id: this.userId });
    if (error) throw error;
  }
  private async leaderboard(weekly: boolean): Promise<LeaderboardEntry[]> {
    const { data, error } = await this.client.rpc('get_leaderboard', { weekly });
    if (error) throw error;
    return data ?? [];
  }
  getWeeklyLeaderboard() {
    return this.leaderboard(true);
  }
  getAllTimeLeaderboard() {
    return this.leaderboard(false);
  }
  async getPersonalBest(): Promise<number | null> {
    const { data, error } = await this.client
      .from('scores')
      .select('score')
      .eq('user_id', this.userId)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data?.score ?? null;
  }
  async getWeeklyRank(): Promise<number | null> {
    const { data, error } = await this.client.rpc('get_my_weekly_rank');
    if (error) throw error;
    return data === null ? null : Number(data);
  }
}
