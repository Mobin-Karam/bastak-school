import "reflect-metadata";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DataSource } from "typeorm";
import { databaseMigrationGlob } from "../src/database/migration-path";

// Real migration discovery, using the same layouts as the two compiled servers.
describe("runtime-relative migration discovery", () => {
  it.each(["dist", "dist-dev"])(
    "runs migrations beside the %s build instead of the current working directory",
    async (build) => {
      const root = await mkdtemp(
        path.join(os.tmpdir(), "attendance-migrations-"),
      );
      let db: DataSource | undefined;
      try {
        const directory = path.join(root, build, "database");
        await mkdir(path.join(directory, "migrations"), { recursive: true });
        await writeFile(
          path.join(directory, "migrations", "1730200000000-Fixture.js"),
          `module.exports.Fixture1730200000000 = class Fixture1730200000000 {
        name = 'Fixture1730200000000';
        async up(q) { await q.query('CREATE TABLE migration_discovery_verified(id integer PRIMARY KEY)'); }
        async down(q) { await q.query('DROP TABLE migration_discovery_verified'); }
      };`,
        );
        db = await new DataSource({
          type: "better-sqlite3",
          database: ":memory:",
          migrations: [
            databaseMigrationGlob(path.join(directory, "data-source.js")),
          ],
        }).initialize();
        const migrated = await db.runMigrations();
        expect(migrated.map((migration) => migration.name)).toEqual([
          "Fixture1730200000000",
        ]);
        expect(
          await db.query(
            "SELECT name FROM sqlite_master WHERE name='migration_discovery_verified'",
          ),
        ).toEqual([{ name: "migration_discovery_verified" }]);
        expect(await db.runMigrations()).toEqual([]);
      } finally {
        if (db?.isInitialized) await db.destroy();
        await rm(root, { recursive: true, force: true });
      }
    },
  );
  it("uses TypeScript files for the source migration CLI", () => {
    expect(
      databaseMigrationGlob("/project/apps/api/src/database/data-source.ts"),
    ).toBe("/project/apps/api/src/database/migrations/*.ts");
  });
});
