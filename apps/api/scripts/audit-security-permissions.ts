import "reflect-metadata";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DataSource } from "typeorm";
import * as entities from "../src/database/entities";

// Configuration metadata only, derived from migrations on a new disposable database.
// No caller-supplied database path and no application configuration import.
async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bastak-permission-audit-"));
  const source = new DataSource({
    type: "better-sqlite3", database: path.join(root, "permissions.sqlite"),
    entities: Object.values(entities).filter((value) => typeof value === "function"),
    migrations: [path.resolve(__dirname, "../src/database/migrations/*.ts")],
    synchronize: false, migrationsRun: true, migrationsTransactionMode: "each",
    prepareDatabase: (native) => native.pragma("foreign_keys = ON"),
  });
  try {
    await source.initialize();
    const roles: { code: string }[] = await source.query("SELECT code FROM roles ORDER BY code");
    const permissions: { code: string }[] = await source.query("SELECT code FROM permissions ORDER BY code");
    const grants: { role: string; permission: string }[] = await source.query("SELECT r.code role,p.code permission FROM role_permissions rp JOIN roles r ON r.id=rp.roleId JOIN permissions p ON p.id=rp.permissionId ORDER BY r.code,p.code");
    console.log(JSON.stringify({
      source: "fresh versioned migrations; no production records", schema: 1,
      permissions: permissions.map((permission) => permission.code),
      roles: Object.fromEntries(roles.map(({ code }) => [code, grants.filter((grant) => grant.role === code).map((grant) => grant.permission)])),
      platformExpansion: "AuthorizationService.enrich expands PLATFORM_ADMIN to all known permissions at runtime",
      limitation: "Deployment-specific role overrides, per-user capability grants, disabled features and membership/resource scope must be evaluated separately",
    }, null, 2));
  } finally {
    if (source.isInitialized) await source.destroy();
    fs.rmSync(root, { recursive: true, force: true });
  }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Permission audit failed"); process.exitCode = 1; });
