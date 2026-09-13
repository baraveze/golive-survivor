import { createClient } from '@supabase/supabase-js';
import { LocalScoreRepository } from './score/LocalScoreRepository';
import { SupabaseScoreRepository } from './score/SupabaseScoreRepository';
import type { ScoreRepository } from './score/ScoreRepository';
import { recordAccess } from './access';

export async function createScoreRepository(): Promise<{
  repository: ScoreRepository;
  notice: string;
}> {
  const local = new LocalScoreRepository();
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) return { repository: local, notice: '' };
  try {
    if (!key.startsWith('sb_publishable_') || !/^https:\/\//.test(url))
      throw new Error('Invalid public configuration');
    const client = createClient(url, key, {
      global: {
        fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(6000) }),
      },
    });
    const initialize = async () => {
      const session = await client.auth.getSession();
      if (session.error) throw session.error;
      const auth = session.data.session
        ? { data: { user: session.data.session.user }, error: null }
        : await client.auth.signInAnonymously();
      if (auth.error || !auth.data.user) throw auth.error || new Error('No session');
      const repository = new SupabaseScoreRepository(client, auth.data.user.id);
      await repository.getWeeklyLeaderboard();
      return repository;
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const repository = await Promise.race([
        initialize(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Connection timeout')), 8000);
        }),
      ]);
      void recordAccess(client, repository.userId);
      return { repository, notice: '' };
    } catch (error) {
      client.auth.stopAutoRefresh();
      throw error;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return {
      repository: local,
      notice: 'No pudimos conectar el ranking. Podés jugar y guardar tus partidas localmente.',
    };
  }
}
