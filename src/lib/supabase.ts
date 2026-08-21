import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * One client for the whole app.
 *
 * If the env vars are missing the app still runs — you can play practice
 * matches on a plane — so every call site treats `db` as possibly null rather
 * than crashing the classroom.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const hasBackend = Boolean(url && key);

export const db: SupabaseClient | null = hasBackend
  ? createClient(url!, key!, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 30 } },
    })
  : null;

if (!hasBackend && import.meta.env.DEV) {
  console.warn(
    '[penfight] No VITE_SUPABASE_* env vars — running offline. ' +
      'Practice mode works; rankings and friend matches are disabled.',
  );
}
