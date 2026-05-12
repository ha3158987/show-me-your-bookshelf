import type { Session } from "@supabase/supabase-js";
import { createLocalStorage } from "./localStorage";
import { createSupabaseStorage } from "./supabaseStorage";
import { getSupabaseBrowserClient } from "../auth/supabase";
import type { LibraryStorage } from "./storage";

/**
 * Returns the appropriate `LibraryStorage` implementation for the
 * current auth state. UI code passes the session it already has;
 * this module owns the swap logic so call sites stay simple.
 *
 * - `session === null` → IndexedDB (guest mode)
 * - `session !== null` → Supabase (signed in)
 */
export function getStorage(session: Session | null): LibraryStorage {
  if (session) {
    return createSupabaseStorage(getSupabaseBrowserClient());
  }
  return createLocalStorage();
}

export { migrateLocalToCloud } from "./migrate";
export type { MigrationResult } from "./migrate";
export type { LibraryStorage } from "./storage";
export type { Book, Quote, LibraryEntry } from "./types";
