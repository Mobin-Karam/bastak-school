// Run with the selected API image's Node/better-sqlite3, only in isolated mounts.
const fs = require("node:fs");
const crypto = require("node:crypto");
const Database = require("better-sqlite3");
// Migration-specific allowances for values written into columns that did not
// exist in the source snapshot. Keep this list narrow: an unlisted column is a
// failed rehearsal, not an implicit permission to transform live data. This is
// intentionally self-contained because production streams this helper to Node.
const expectations = {
  AcademicSchedulingFoundation1730900000000: {
    "education_classes.academicYearId": {
      nullable: true,
      value: "null",
    },
    "timetable_periods.weekdays": {
      default: "[]",
      value: "default",
    },
  },

  TimetableImportIdempotency1731000000000: {
    "timetable_imports.fingerprint": {
      default: "",
      value: "legacy-id",
    },
  },

  TimetableImportSourceRows1731100000000: {
    "timetable_imports.sourceRows": {
      default: "[]",
      value: "default",
    },
  },

  // Attendance correction approval migration
  AttendanceCorrectionReview1731300000000: {
    "attendance_policies.correctionRequiresReview": {
      nullable: false,
      default: 0,
      value: "default",
    },

    "attendance_corrections.status": {
      nullable: false,
      default: "approved",
      value: "default",
    },

    "attendance_corrections.reviewedById": {
      nullable: true,
      value: "null",
    },

    "attendance_corrections.reviewRequestId": {
      nullable: true,
      value: "null",
    },

    "attendance_corrections.reviewNote": {
      nullable: false,
      default: "",
      value: "default",
    },

    "attendance_corrections.reviewedAt": {
      nullable: true,
      value: "null",
    },
  },
};
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
function quote(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}
function stable(value) {
  return JSON.stringify(value);
}
function tableRows(db, name, columns) {
  return db
    .prepare(`SELECT ${columns.map(quote).join(",")} FROM ${quote(name)}`)
    .all();
}
function tableInventory(db, name) {
  const columns = db
    .prepare(`PRAGMA table_info(${quote(name)})`)
    .all()
    .map(({ name, notnull, dflt_value }) => ({
      name,
      notnull: Boolean(notnull),
      default: dflt_value,
    }));
  const records = tableRows(
    db,
    name,
    columns.map(({ name: column }) => column),
  );
  const encoded = records.map(stable).sort();
  return {
    columns,
    records,
    encoded,
    count: encoded.length,
    digest: crypto.createHash("sha256").update(stable(encoded)).digest("hex"),
  };
}
function inventory(db) {
  const schema = db
    .prepare(
      "SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name",
    )
    .all();
  const rows = {};
  const tableNames = new Set();
  for (const { name } of db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all()) {
    tableNames.add(name);
    rows[name] = tableInventory(db, name);
  }
  const orphanedScopedRoleAssignmentIds =
    tableNames.has("user_role_assignments") && tableNames.has("roles")
      ? db
          .prepare(
            `SELECT a.id FROM user_role_assignments a
             JOIN roles r ON r.id=a.roleId
             WHERE r.organizationScoped=1 AND a.membershipId IS NULL
             ORDER BY a.id`,
          )
          .all()
          .map(({ id }) => id)
      : [];
  return { schema, rows, orphanedScopedRoleAssignmentIds };
}
function preservedRoleAssignments(before, after) {
  const original = new Map(
    (before.rows.user_role_assignments?.encoded || []).map((record) => [
      JSON.parse(record).id,
      record,
    ]),
  );
  const upgraded = new Map(
    (after.rows.user_role_assignments?.encoded || []).map((record) => [
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
      throw new Error(
        "Migration removed a role assignment outside the approved orphan repair",
      );
  }
  for (const id of approvedRemovals) {
    if (upgraded.has(id))
      throw new Error(
        "Migration did not remove an orphaned scoped role assignment",
      );
  }
}
function fail(table, reason, beforeValue, afterValue) {
  const details = [
    `table=${table}`,
    `reason=${reason}`,
    beforeValue && `beforeRows=${beforeValue.count}`,
    afterValue && `afterRows=${afterValue.count}`,
  ]
    .filter(Boolean)
    .join("; ");
  throw new Error(`Migration preservation failed (${details})`);
}
function appliedMigrationNames(before, after) {
  const oldNames = new Set(
    (before.rows.migrations?.records || []).map(({ name }) => name),
  );
  return new Set(
    (after.rows.migrations?.records || [])
      .map(({ name }) => name)
      .filter((name) => !oldNames.has(name)),
  );
}

//  -------------------------

function expectationFor(applied, table, column) {
  const key = `${table}.${column}`;
  for (const migration of applied) {
    if (expectations[migration]?.[key]) return expectations[migration][key];
  }
  return null;
}
function defaultValue(db, definition) {
  if (definition.default === null) return null;
  return db.prepare(`SELECT (${definition.default}) AS value`).get().value;
}
function same(left, right) {
  return stable(left) === stable(right);
}

//  -------------------------

function validateAddedColumns(beforeTable, afterTable, table, applied, db) {
  const beforeColumns = new Set(beforeTable.columns.map(({ name }) => name));
  const additions = afterTable.columns.filter(
    ({ name }) => !beforeColumns.has(name),
  );
  if (!additions.length) return;
  // Check schema even when the original table is empty.
  for (const column of additions) {
    const expectation = expectationFor(applied, table, column.name);
    if (!expectation)
      fail(
        table,
        `unexpected added column ${column.name}`,
        beforeTable,
        afterTable,
      );
    if (
      expectation.nullable !== undefined &&
      expectation.nullable !== !column.notnull
    )
      fail(
        table,
        `unexpected nullability for ${column.name}`,
        beforeTable,
        afterTable,
      );
    if (
      expectation.default !== undefined &&
      !same(defaultValue(db, column), expectation.default)
    )
      fail(
        table,
        `unexpected default for ${column.name}`,
        beforeTable,
        afterTable,
      );
  }
  const originalColumns = beforeTable.columns.map(({ name }) => name);
  const unmatched = new Map();
  for (const encoded of beforeTable.encoded)
    unmatched.set(encoded, (unmatched.get(encoded) || 0) + 1);
  for (const row of afterTable.records) {
    const projected = Object.fromEntries(
      originalColumns.map((name) => [name, row[name]]),
    );
    const encoded = stable(projected);
    if (!unmatched.get(encoded)) continue;
    unmatched.set(encoded, unmatched.get(encoded) - 1);
    for (const column of additions) {
      const expectation = expectationFor(applied, table, column.name);
      if (!expectation)
        fail(
          table,
          `unexpected added column ${column.name}`,
          beforeTable,
          afterTable,
        );
      if (
        expectation.nullable !== undefined &&
        expectation.nullable !== !column.notnull
      )
        fail(
          table,
          `unexpected nullability for ${column.name}`,
          beforeTable,
          afterTable,
        );
      const actualDefault = defaultValue(db, column);
      if (
        expectation.default !== undefined &&
        !same(actualDefault, expectation.default)
      )
        fail(
          table,
          `unexpected default for ${column.name}`,
          beforeTable,
          afterTable,
        );
      const value = row[column.name];
      if (expectation.value === "null" && value !== null)
        fail(
          table,
          `non-null value in ${column.name}`,
          beforeTable,
          afterTable,
        );
      if (expectation.value === "default" && !same(value, actualDefault))
        fail(
          table,
          `non-default value in ${column.name}`,
          beforeTable,
          afterTable,
        );
      if (expectation.value === "legacy-id" && value !== `legacy-${row.id}`)
        fail(
          table,
          `unexpected legacy value in ${column.name}`,
          beforeTable,
          afterTable,
        );
    }
  }
}
function preserved(before, after, db) {
  const applied = appliedMigrationNames(before, after);
  for (const [table, value] of Object.entries(before.rows)) {
    if (table === "migrations") continue;
    const upgraded = after.rows[table];
    if (!upgraded) fail(table, "table missing after migration", value, null);
    const upgradedColumns = new Set(upgraded.columns.map(({ name }) => name));
    if (value.columns.some(({ name }) => !upgradedColumns.has(name)))
      fail(table, "original column missing after migration", value, upgraded);
    if (table === "user_role_assignments") {
      preservedRoleAssignments(before, after);
      continue;
    }
    const projected = upgraded.records
      .map((row) =>
        Object.fromEntries(value.columns.map(({ name }) => [name, row[name]])),
      )
      .map(stable)
      .sort();
    const available = new Map();
    for (const encoded of projected)
      available.set(encoded, (available.get(encoded) || 0) + 1);
    if (
      value.encoded.some((encoded) => {
        const count = available.get(encoded) || 0;
        available.set(encoded, count - 1);
        return count === 0;
      })
    )
      fail(table, "existing logical records changed", value, upgraded);
    validateAddedColumns(value, upgraded, table, applied, db);
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
    preserved(before, inventory(upgraded), upgraded);
    upgraded.close();
    console.log(
      "Isolated migration compatibility and existing-record preservation verified",
    );
    return;
  }
  source.close();
  console.log("Snapshot restoration verified");
}
// CI and immutable deployment stream this self-contained helper through stdin.
if (
  require.main === module ||
  (process.argv[1] === "-" && module.id === "[stdin]")
) {
  main().catch((error) => {
    console.error(
      `Database recovery verification failed (${error.code || error.name}); live replacement is not authorized`,
    );
    console.error(error.stack || error.message || String(error));
    process.exitCode = 1;
  });
}

module.exports = { inventory, preserved };
