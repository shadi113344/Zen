/**
 * Forward-only schema migration for the local snapshot (and any versioned blob).
 *
 * The local-first model means old snapshots live on users' devices and in
 * export files. Before any snapshot reshape ships, bump the consumer's
 * `currentVersion` and add a step here so old data upgrades on read instead of
 * silently mis-parsing. This is the local-first analog of a forward DB migration.
 */

/** A plain record that may carry a `schemaVersion` for forward migration. */
export type VersionedRecord = Record<string, unknown> & { schemaVersion?: number };

/** `migrations[n]` upgrades a record from version `n-1` to version `n`. */
export type SchemaMigrations<T extends VersionedRecord> = Record<number, (raw: T) => T>;

/**
 * Apply ordered migration steps from the record's own version up to
 * `currentVersion`, then stamp it at `currentVersion`.
 *
 * - A record with no (or invalid) `schemaVersion` is treated as version 0.
 * - Steps are applied in ascending order; missing step numbers are skipped.
 * - A record already at/above `currentVersion` is returned unchanged except the
 *   version stamp (no step runs), so newer-on-older reads never lose data.
 */
export function runSchemaMigrations<T extends VersionedRecord>(
  raw: T,
  currentVersion: number,
  migrations: SchemaMigrations<T>,
): T {
  const from =
    typeof raw.schemaVersion === "number" && raw.schemaVersion >= 0 ? raw.schemaVersion : 0;

  let data = raw;
  for (let v = from + 1; v <= currentVersion; v++) {
    const step = migrations[v];
    if (step) data = step(data);
  }

  return { ...data, schemaVersion: currentVersion };
}
