// Run with the selected API image's Node/better-sqlite3, only in isolated mounts.
const fs = require("node:fs");
const crypto = require("node:crypto");
const Database = require("better-sqlite3");
const [command, original, destination] = process.argv.slice(2);
function open(file) {
  const db = new Database(file, { readonly: true, fileMustExist: true });
  db.pragma("foreign_keys = ON");
  if (
    db.pragma("integrity_check", { simple: true }) !== "ok" ||
    db.pragma("foreign_key_check").length
  ) {
    db.close();
    throw new Error("Snapshot integrity validation failed");
  }
  return db;
}
function inventory(db) {
  const schema = db
    .prepare(
      "SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name",
    )
    .all();
  const rows = {};
  for (const { name } of db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all()) {
    const encoded = db
      .prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`)
      .all()
      .map((row) => JSON.stringify(row))
      .sort();
    rows[name] = {
      count: encoded.length,
      digest: crypto
        .createHash("sha256")
        .update(JSON.stringify(encoded))
        .digest("hex"),
      ...(name === "user_role_assignments" ? { records: encoded } : {}),
    };
  }
  const orphanedScopedRoleAssignmentIds = db
    .prepare(
      `SELECT a.id FROM user_role_assignments a
       JOIN roles r ON r.id=a.roleId
       WHERE r.organizationScoped=1 AND a.membershipId IS NULL
       ORDER BY a.id`,
    )
    .all()
    .map(({ id }) => id);
  return { schema, rows, orphanedScopedRoleAssignmentIds };
}
function preservedRoleAssignments(before, after) {
  const original = new Map(
    (before.rows.user_role_assignments?.records || []).map((record) => [
      JSON.parse(record).id,
      record,
    ]),
  );
  const upgraded = new Map(
    (after.rows.user_role_assignments?.records || []).map((record) => [
      JSON.parse(record).id,
      record,
    ]),
  );
  const approvedRemovals = new Set(before.orphanedScopedRoleAssignmentIds);
  for (const [id, record] of upgraded) {
    if (original.get(id) !== record)
      throw new Error("Migration changed an existing role assignment");
  }
  for (const id of original.keys()) {
    if (!upgraded.has(id) && !approvedRemovals.has(id))
      throw new Error("Migration removed a role assignment outside the approved orphan repair");
  }
  for (const id of approvedRemovals) {
    if (upgraded.has(id))
      throw new Error("Migration did not remove an orphaned scoped role assignment");
  }
}
function preserved(before, after) {
  for (const [table, value] of Object.entries(before.rows)) {
    if (table === "migrations") continue;
    if (table === "user_role_assignments") {
      preservedRoleAssignments(before, after);
      continue;
    }
    if (JSON.stringify(value) !== JSON.stringify(after.rows[table]))
      throw new Error("Migration changed existing logical records");
  }
}
async function main() {
  if (
    !["backup", "verify", "rehearse"].includes(command) ||
    !original ||
    !destination ||
    original === destination
  )
    throw new Error("Invalid isolated recovery arguments");
  let sourcePath = original;
  if (command === "backup") {
    // Caller has stopped the writer. A byte copy of the complete stopped file set
    // avoids SQLite creating WAL/SHM files on the read-only live-volume mount.
    sourcePath = destination + ".source";
    for (const suffix of ["", "-wal", "-shm"]) {
      if (!fs.existsSync(original + suffix)) continue;
      if (fs.existsSync(sourcePath + suffix))
        throw new Error("Recovery source destination already exists");
      fs.copyFileSync(
        original + suffix,
        sourcePath + suffix,
        fs.constants.COPYFILE_EXCL,
      );
      fs.chmodSync(sourcePath + suffix, 0o600);
    }
  }
  const source = open(sourcePath);
  const before = inventory(source);
  if (command === "backup") {
    if (fs.existsSync(destination) || fs.existsSync(destination + ".restored"))
      throw new Error("Snapshot destination already exists");
    await source.backup(destination);
    const snapshot = open(destination);
    await snapshot.backup(destination + ".restored");
    const restored = open(destination + ".restored");
    if (JSON.stringify(before) !== JSON.stringify(inventory(restored)))
      throw new Error("Restore contents/schema mismatch");
    restored.close();
    snapshot.close();
    fs.chmodSync(destination, 0o600);
    fs.chmodSync(destination + ".restored", 0o600);
    fs.writeFileSync(
      destination + ".verification.json",
      JSON.stringify({
        verified: true,
        sha256: crypto
          .createHash("sha256")
          .update(fs.readFileSync(destination))
          .digest("hex"),
        tables: Object.keys(before.rows).length,
        rows: Object.values(before.rows).reduce((n, r) => n + r.count, 0),
        verifiedAt: new Date().toISOString(),
      }) + "\n",
      { mode: 0o600 },
    );
  } else if (command === "verify") {
    const restored = open(destination);
    if (JSON.stringify(before) !== JSON.stringify(inventory(restored)))
      throw new Error("Restore contents/schema mismatch");
    restored.close();
  } else {
    source.close();
    if (
      !fs.existsSync(destination) ||
      process.env.DATABASE_PATH !== destination
    )
      throw new Error("Isolated migration path mismatch");
    const candidate = open(destination);
    if (JSON.stringify(before) !== JSON.stringify(inventory(candidate)))
      throw new Error("Rehearsal must start from the verified snapshot");
    candidate.close();
    const dataSource = require(
      process.cwd() + "/dist/database/data-source.js",
    ).default;
    await dataSource.initialize(); // synchronize:false; same migration chain as production startup
    await dataSource.destroy();
    const upgraded = open(destination);
    preserved(before, inventory(upgraded));
    upgraded.close();
    console.log(
      "Isolated migration compatibility and existing-record preservation verified",
    );
    return;
  }
  source.close();
  console.log("Snapshot restoration verified");
}
if (require.main === module) {
  main().catch((error) => {
    console.error(
      `Database recovery verification failed (${error.code || error.name}); live replacement is not authorized`,
    );
    console.error(error.stack || error.message || String(error));
    process.exitCode = 1;
  });
}

module.exports = { inventory, preserved };
