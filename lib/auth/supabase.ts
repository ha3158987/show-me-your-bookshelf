import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Returns the singleton browser Supabase client. Reads
 * `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
 * the environment at first call.
 *
 * Throws if env vars are missing — callers in guest-eligible code
 * should catch and fall back to IndexedDB.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error(
      "Supabase env vars are not configured (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }

  cached = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return cached;
}

/** Test helper: clear the cached client so tests can reinitialize env. */
export function _resetSupabaseClientForTests() {
  cached = null;
}
