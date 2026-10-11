import path from "node:path";

/** Works in Nest watch (dist-dev), production (dist), and the ts-node migration CLI. */
export function databaseMigrationGlob(runtimeFile: string): string {
  return path.join(
    path.dirname(runtimeFile),
    "migrations",
    runtimeFile.endsWith(".ts") ? "*.ts" : "*.js",
  );
}
