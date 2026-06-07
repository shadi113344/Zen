import { describe, expect, it } from "vitest";
import { runSchemaMigrations, type SchemaMigrations, type VersionedRecord } from "./snapshot-migrate";

interface Snap extends VersionedRecord {
  habits: string[];
  tag?: string;
}

describe("runSchemaMigrations", () => {
  it("treats a record with no schemaVersion as version 0 and runs every step", () => {
    const steps: SchemaMigrations<Snap> = {
      1: (r) => ({ ...r, tag: "v1" }),
      2: (r) => ({ ...r, tag: `${r.tag}->v2` }),
    };
    const out = runSchemaMigrations<Snap>({ habits: ["a"] }, 2, steps);
    expect(out.schemaVersion).toBe(2);
    expect(out.tag).toBe("v1->v2");
    expect(out.habits).toEqual(["a"]); // data preserved
  });

  it("only runs steps newer than the record's current version", () => {
    const calls: number[] = [];
    const steps: SchemaMigrations<Snap> = {
      1: (r) => (calls.push(1), r),
      2: (r) => (calls.push(2), { ...r, tag: "v2" }),
      3: (r) => (calls.push(3), { ...r, tag: `${r.tag}->v3` }),
    };
    const out = runSchemaMigrations<Snap>({ habits: [], schemaVersion: 1 }, 3, steps);
    expect(calls).toEqual([2, 3]); // step 1 skipped (already at v1)
    expect(out.tag).toBe("v2->v3");
    expect(out.schemaVersion).toBe(3);
  });

  it("tolerates missing step numbers", () => {
    const steps: SchemaMigrations<Snap> = { 2: (r) => ({ ...r, tag: "only2" }) };
    const out = runSchemaMigrations<Snap>({ habits: [] }, 2, steps);
    expect(out.tag).toBe("only2");
    expect(out.schemaVersion).toBe(2);
  });

  it("stamps the version without running steps when already current", () => {
    const steps: SchemaMigrations<Snap> = { 1: (r) => ({ ...r, tag: "should-not-run" }) };
    const out = runSchemaMigrations<Snap>({ habits: ["x"], schemaVersion: 1 }, 1, steps);
    expect(out.tag).toBeUndefined();
    expect(out.schemaVersion).toBe(1);
  });

  it("never downgrades or loses data when read by an older current version", () => {
    const out = runSchemaMigrations<Snap>({ habits: ["y"], schemaVersion: 5, tag: "future" }, 2, {});
    expect(out.habits).toEqual(["y"]);
    expect(out.tag).toBe("future");
    // stamped to the runner's currentVersion; no steps exist to mutate future data
    expect(out.schemaVersion).toBe(2);
  });
});
