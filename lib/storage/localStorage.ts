/**
 * Schema migration runner for localStorage.
 * Call runMigrationIfNeeded() once on app boot (before store rehydration).
 *
 * Guard: all operations check typeof window to be SSR-safe.
 */

const SCHEMA_VERSION_KEY = "wird-schema-version";
const CURRENT_SCHEMA_VERSION = 1;

/** Ordered list of migrations: index N migrates from version N to version N+1. */
const migrations: Array<() => void> = [
  // v0 → v1: remove legacy Supabase auth token if it was ever stored
  function migrateV0toV1() {
    localStorage.removeItem("supabase.auth.token");
  },
];

/**
 * Check the stored schema version and run any missing migrations sequentially.
 * Safe to call on every page load — already-applied migrations are skipped.
 */
export function runMigrationIfNeeded(): void {
  if (typeof window === "undefined") return;

  const raw = localStorage.getItem(SCHEMA_VERSION_KEY);
  const storedVersion = raw !== null ? parseInt(raw, 10) : 0;

  if (storedVersion >= CURRENT_SCHEMA_VERSION) return;

  for (let v = storedVersion; v < CURRENT_SCHEMA_VERSION; v++) {
    const migrate = migrations[v];
    if (migrate) {
      try {
        migrate();
      } catch (err) {
        // Non-fatal: log and continue so subsequent migrations still run
        console.error(`[wird] schema migration v${v}→v${v + 1} failed:`, err);
      }
    }
  }

  localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
}
