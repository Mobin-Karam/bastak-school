import "reflect-metadata";
import { DataSource } from "typeorm";
import { DormitorySupervisorCapabilities1731300200000 } from "../src/database/migrations/1731300200000-DormitorySupervisorCapabilities";

describe("dormitory supervisor capability migration", () => {
  it("grants the active dormitory capabilities without deleting historical permissions", async () => {
    const db = await new DataSource({
      type: "better-sqlite3",
      database: ":memory:",
    }).initialize();
    const q = db.createQueryRunner();
    try {
      await q.query("CREATE TABLE roles(id varchar PRIMARY KEY, code varchar UNIQUE)");
      await q.query("CREATE TABLE permissions(id varchar PRIMARY KEY, code varchar UNIQUE, description varchar)");
      await q.query("CREATE TABLE role_permissions(id varchar PRIMARY KEY, roleId varchar, permissionId varchar, UNIQUE(roleId,permissionId))");
      await q.query("INSERT INTO roles(id,code) VALUES('supervisor','SCHOOL_SUPERVISOR')");
      await q.query("INSERT INTO permissions(id,code,description) VALUES('legacy','dorms.manage','legacy capability')");
      await q.query("INSERT INTO role_permissions(id,roleId,permissionId) VALUES('legacy-grant','supervisor','legacy')");

      const migration = new DormitorySupervisorCapabilities1731300200000();
      await migration.up(q);
      await migration.up(q);

      expect(
        await q.query(
          "SELECT p.code FROM role_permissions rp JOIN permissions p ON p.id=rp.permissionId WHERE rp.roleId='supervisor' ORDER BY p.code",
        ),
      ).toEqual([
        { code: "dormitory.manage" },
        { code: "dormitory.read" },
        { code: "dorms.manage" },
      ]);
    } finally {
      await q.release();
      await db.destroy();
    }
  });
});
