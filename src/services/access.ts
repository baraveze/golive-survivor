import type { SupabaseClient } from '@supabase/supabase-js';

/** One access per app initialization. Metadata comes from HTTP headers inside Supabase. */
export async function recordAccess(client: SupabaseClient, userId: string): Promise<boolean> {
  try {
    const { error } = await client.from('access_logs').insert({ user_id: userId });
    if (error) throw error;
    return true;
  } catch {
    // Access logging must never prevent playing or saving scores. Do not log personal data.
    console.warn(
      '[Go Live Survivor] No se pudo registrar el acceso. Revisá la conexión y la migración 002_access_logs.sql.',
    );
    return false;
  }
}
