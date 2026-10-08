import { isValidAppVersion, projectAuditRecord } from "@moshaver/cmb-system";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { DataSource, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { AppRelease } from "../../database/entities/app-release.entity";
import { AppVersion } from "../../database/entities/app-version.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { User } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";

@Injectable()
export class SystemService {
  private restoring = false;

  constructor(
    private db: DataSource,
    @InjectRepository(AppVersion) private versions: Repository<AppVersion>,
    @InjectRepository(AppRelease) private releases: Repository<AppRelease>,
    @InjectRepository(AuditLog) private audits: Repository<AuditLog>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  publicVersion(app: string) {
    return this.versions
      .findOneBy({ app })
      .then((row) => row || { app, version: null, updatedAt: null });
  }
  listVersions() {
    return this.versions.find({ order: { app: "ASC" } });
  }
  async updateVersion(app: string, input: { version: string; notes?: string }) {
    if (!isValidAppVersion(input.version))
      throw new ApiException(400, "VERSION_INVALID", "نسخه معتبر نیست.");
    let row = await this.versions.findOneBy({ app });
    row = this.versions.create({
      ...row,
      app,
      version: input.version,
      notes: input.notes || "",
    });
    return this.versions.save(row);
  }
  listReleases() {
    return this.releases.find({ order: { createdAt: "DESC" }, take: 100 });
  }
  async updateRelease(app: string, input: { version: string; notes?: string }) {
    const version = await this.updateVersion(app, input);
    return this.releases.save(
      this.releases.create({
        app,
        version: version.version,
        notes: input.notes || "",
      }),
    );
  }
  auditLogs() {
    return this.audits
      .find({
        relations: { user: true },
        order: { createdAt: "DESC" },
        take: 200,
      })
      .then((rows) =>
        rows.map((row) =>
          projectAuditRecord({
            id: row.id,
            action: row.action,
            entity: row.entity,
            actorUserId: row.user?.id,
            metadata: row.metadata,
            createdAt: row.createdAt,
          }),
        ),
      );
  }
  metadata() {
    const file = this.databasePath();
    const check = this.db
      .query(`PRAGMA quick_check`)
      .then((rows) => rows[0]?.quick_check === "ok");
    return Promise.all([
      check,
      this.db.query(`SELECT COUNT(*) n FROM migrations`),
    ]).then(([healthy, migrations]) => ({
      engine: "sqlite",
      status: healthy ? "healthy" : "error",
      sizeBytes: fs.statSync(file).size,
      path: path.basename(file),
      migrations: Number(migrations[0]?.n || 0),
      remoteRestoreEnabled:
        process.env.ALLOW_REMOTE_DATABASE_RESTORE === "true",
    }));
  }
  async backup(actorId: string) {
    const root = this.tempRoot(),
      file = path.join(
        root,
        `snapshot-${randomBytes(8).toString("hex")}.sqlite`,
      );
    await this.db.query(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
    this.validate(file);
    const buffer = fs.readFileSync(file);
    fs.unlinkSync(file);
    await this.audit(actorId, "database.backup.created", {
      sizeBytes: buffer.length,
    });
    return {
      buffer,
      filename: `moshaver-v2-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`,
    };
  }
  async restore(actorId: string, buffer: Buffer) {
    if (process.env.ALLOW_REMOTE_DATABASE_RESTORE !== "true")
      throw new ApiException(
        403,
        "RESTORE_DISABLED",
        "بازیابی از راه دور غیرفعال است.",
      );
    if (this.restoring)
      throw new ApiException(
        409,
        "RESTORE_IN_PROGRESS",
        "بازیابی دیگری در حال اجرا است.",
      );
    const max = Number(process.env.MAX_RESTORE_BODY || 64 * 1024 * 1024);
    if (!Buffer.isBuffer(buffer) || buffer.length < 4096 || buffer.length > max)
      throw new ApiException(
        400,
        "RESTORE_SIZE_INVALID",
        "اندازه فایل بازیابی معتبر نیست.",
      );
    this.restoring = true;
    const token = randomBytes(8).toString("hex"),
      root = this.tempRoot(),
      upload = path.join(root, `restore-${token}.sqlite`),
      rollback = path.join(root, `rollback-${token}.sqlite`),
      target = this.databasePath(),
      next = `${target}.restore-next-${token}`;
    try {
      fs.writeFileSync(upload, buffer, { mode: 0o600 });
      const inspected = this.validate(upload);
      await this.db.query(`VACUUM INTO '${rollback.replace(/'/g, "''")}'`);
      await this.audit(actorId, "database.restore.started", {
        sizeBytes: buffer.length,
      });
      await this.db.destroy();
      fs.copyFileSync(upload, next);
      fs.renameSync(next, target);
      for (const suffix of ["-wal", "-shm"])
        try {
          fs.unlinkSync(target + suffix);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
      try {
        await this.db.initialize();
        await this.db.query(`PRAGMA quick_check`);
      } catch (error) {
        if (this.db.isInitialized) await this.db.destroy();
        fs.copyFileSync(rollback, target);
        await this.db.initialize();
        throw error;
      }
      await this.audit(actorId, "database.restore.completed", {
        sizeBytes: buffer.length,
        tables: inspected.tables,
        rollbackFilename: path.basename(rollback),
      });
      return {
        restored: true,
        sizeBytes: buffer.length,
        tables: inspected.tables,
        rollbackFilename: path.basename(rollback),
      };
    } finally {
      this.restoring = false;
      for (const file of [upload, next])
        try {
          fs.unlinkSync(file);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
    }
  }

  /** Deletes tenant/product data, retaining only platform-admin accounts, RBAC definitions and the caller's session. */
  async resetSystemData(actor: AuthenticatedUser) {
    const platformAccounts = (await this.db.query(
      `SELECT DISTINCT u.id FROM users u LEFT JOIN user_role_assignments assignment ON assignment.userId=u.id LEFT JOIN roles role ON role.id=assignment.roleId WHERE u.isPlatformOwner=1 OR role.code='PLATFORM_ADMIN'`,
    )) as Array<{ id: string }>;
    const protectedUserIds = [
      ...new Set(platformAccounts.map((row) => row.id)),
    ];
    if (!protectedUserIds.includes(actor.id))
      throw new ApiException(
        403,
        "PLATFORM_OWNER_REQUIRED",
        "حساب مدیر پلتفرم معتبر نیست.",
      );
    const tableRows = (await this.db.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
    )) as Array<{ name: string }>;
    const tables = new Set(tableRows.map((row) => row.name));
    const preserve = new Set([
      "migrations",
      "roles",
      "permissions",
      "role_permissions",
      "users",
      "user_role_assignments",
      "sessions",
      "platform_enrollment_settings",
    ]);
    const removableTables = [...tables].filter((table) => !preserve.has(table));
    const protectedMarks = protectedUserIds.map(() => "?").join(",");
    await this.db.query("PRAGMA foreign_keys = OFF");
    try {
      await this.db.transaction(async (manager) => {
        for (const table of removableTables)
          await manager.query(`DELETE FROM ${this.identifier(table)}`);
        if (tables.has("user_role_assignments"))
          await manager.query("DELETE FROM user_role_assignments");
        if (tables.has("sessions"))
          await manager.query("DELETE FROM sessions WHERE id <> ?", [
            actor.sessionId,
          ]);
        await manager.query(
          `DELETE FROM users WHERE id NOT IN (${protectedMarks})`,
          protectedUserIds,
        );
        if (tables.has("user_role_assignments"))
          for (const userId of protectedUserIds)
            await manager.query(
              `INSERT INTO user_role_assignments(id,userId,roleId,membershipId) SELECT lower(hex(randomblob(16))),?,id,NULL FROM roles WHERE code='PLATFORM_ADMIN'`,
              [userId],
            );
        if (tables.has("platform_enrollment_settings")) {
          await manager.query("DELETE FROM platform_enrollment_settings");
          await manager.query(
            "INSERT INTO platform_enrollment_settings (id, publicStudentSignupEnabled) VALUES (1, 0)",
          );
        }
      });
    } finally {
      await this.db.query("PRAGMA foreign_keys = ON");
    }
    const quickCheck = await this.db.query(`PRAGMA quick_check`);
    if (quickCheck[0]?.quick_check !== "ok")
      throw new ApiException(
        500,
        "RESET_INTEGRITY_FAILED",
        "بازنشانی انجام شد اما بررسی یکپارچگی ناموفق بود.",
      );
    await this.audit(actor.id, "system.data.reset", {
      retainedPlatformAccounts: protectedUserIds.length,
      clearedTables: removableTables.length,
    });
    return {
      reset: true,
      retainedPlatformAccounts: protectedUserIds.length,
      clearedTables: removableTables.length,
    };
  }

  private identifier(value: string) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  private validate(file: string) {
    const db = new Database(file, { readonly: true, fileMustExist: true });
    try {
      const check = db.pragma("quick_check", { simple: true });
      if (check !== "ok")
        throw new ApiException(400, "SQLITE_INVALID", "فایل SQLite سالم نیست.");
      const tables = (
        db
          .prepare(`SELECT name FROM sqlite_master WHERE type='table'`)
          .all() as { name: string }[]
      ).map((item) => item.name);
      for (const required of ["users", "students", "plans", "migrations"])
        if (!tables.includes(required))
          throw new ApiException(
            400,
            "SCHEMA_INVALID",
            `جدول الزامی ${required} وجود ندارد.`,
          );
      return { tables: tables.length };
    } finally {
      db.close();
    }
  }
  private databasePath() {
    const value =
      this.db.options.type === "better-sqlite3" ? this.db.options.database : "";
    if (typeof value !== "string" || !path.isAbsolute(value))
      throw new ApiException(
        500,
        "DATABASE_PATH_INVALID",
        "مسیر پایگاه داده معتبر نیست.",
      );
    return value;
  }
  private tempRoot() {
    const root = path.join(os.tmpdir(), "moshaver-v2-backups");
    fs.mkdirSync(root, { recursive: true, mode: 0o700 });
    return root;
  }
  private async audit(
    userId: string,
    action: string,
    metadata: Record<string, unknown>,
  ) {
    const user = await this.users.findOneBy({ id: userId });
    await this.audits.save(
      this.audits.create({ user, action, entity: "database", metadata }),
    );
  }
}
