import type { LibraryStorage } from "./storage";

export interface MigrationResult {
  booksMigrated: number;
  quotesMigrated: number;
}

/**
 * Copies every library entry and quote from the local (IndexedDB) store
 * into the cloud (Supabase) store. Designed to run once, on first sign-in.
 *
 * Idempotent: a book already present in the cloud is skipped, and quotes
 * are deduplicated by `(text, page)` fingerprint within each book —
 * letting the function run multiple times safely (e.g. on every app
 * boot until the user clears local data).
 *
 * Local data is NOT cleared after migration — that's a separate, user-
 * triggered "I'm done with guest mode" action.
 */
export async function migrateLocalToCloud(
  local: LibraryStorage,
  cloud: LibraryStorage,
): Promise<MigrationResult> {
  const localEntries = await local.listLibrary();
  const cloudEntries = await cloud.listLibrary();
  const cloudIsbns = new Set(cloudEntries.map((e) => e.bookIsbn));

  let booksMigrated = 0;
  let quotesMigrated = 0;

  for (const entry of localEntries) {
    const isAlreadyInCloud = cloudIsbns.has(entry.bookIsbn);

    if (!isAlreadyInCloud) {
      const book = await local.getBook(entry.bookIsbn);
      if (!book) continue;
      await cloud.addToLibrary(book);
      booksMigrated += 1;
    }

    // Always reconcile quotes (handles the case where a book exists in the
    // cloud but new quotes were added locally afterward).
    const localQuotes = await local.listQuotes(entry.bookIsbn);
    const cloudQuotes = await cloud.listQuotes(entry.bookIsbn);
    const existingFingerprints = new Set(
      cloudQuotes.map((q) => `${q.text}|${q.page ?? ""}`),
    );

    for (const q of localQuotes) {
      const fp = `${q.text}|${q.page ?? ""}`;
      if (existingFingerprints.has(fp)) continue;
      await cloud.addQuote({
        bookIsbn: q.bookIsbn,
        text: q.text,
        page: q.page,
      });
      quotesMigrated += 1;
    }
  }

  return { booksMigrated, quotesMigrated };
}
