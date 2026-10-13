import "reflect-metadata";
import fs from "node:fs";
import path from "node:path";
import { DataSource } from "typeorm";
import * as entities from "../../src/database/entities";

export async function migratedDatabase(
  includeIntegrity = true,
  excludeMigrations: string[] = [],
) {
  const directory = path.resolve(__dirname, "../../src/database/migrations");
  return new DataSource({
    type: "better-sqlite3",
    database: ":memory:",
    synchronize: false,
    entities: Object.values(entities).filter(
      (value) => typeof value === "function",
    ),
    migrations: fs
      .readdirSync(directory)
      .filter(
        (file) =>
          file.endsWith(".ts") &&
          !excludeMigrations.some((id) => file.includes(id)) &&
          (includeIntegrity || !file.includes("1730700000000")),
      )
      .map((file) => path.join(directory, file)),
    migrationsRun: true,
    migrationsTransactionMode: "each",
    prepareDatabase: (db) => db.pragma("foreign_keys = ON"),
  }).initialize();
}
