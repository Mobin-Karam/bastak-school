import "reflect-metadata";
import fs from "node:fs";
import path from "node:path";
import { DataSource, DataSourceOptions } from "typeorm";
import * as entities from "./entities";
import { databaseMigrationGlob } from "./migration-path";

const databasePath =
  process.env.DATABASE_PATH ||
  path.resolve(process.cwd(), "data", "moshaver-v2.sqlite");

const dir = path.dirname(databasePath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const entityClasses = Object.values(entities).filter(
  (value) => typeof value === "function",
) as any[];

export const dataSourceOptions: DataSourceOptions = {
  type: "better-sqlite3",
  database: databasePath,
  entities: entityClasses as any,
  // Resolve beside the running source/build: dev uses dist-dev, production uses dist.
  migrations: [databaseMigrationGlob(__filename)],
  synchronize: false,
  migrationsRun: true,
  // SQLite table rebuilds need a connection-level pragma outside a transaction.
  // Each migration remains atomic; the integrity migration owns its transaction.
  migrationsTransactionMode: "each",
  prepareDatabase: (db) => {
    db.pragma("foreign_keys = ON");
    db.pragma("journal_mode = WAL");
    db.pragma(
      `busy_timeout = ${Number(process.env.SQLITE_BUSY_TIMEOUT_MS || 5000)}`,
    );
  },
};

export default new DataSource(dataSourceOptions);
