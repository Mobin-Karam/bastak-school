"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemService = void 0;
const cmb_system_1 = require("@moshaver/cmb-system");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const node_crypto_1 = require("node:crypto");
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const app_release_entity_1 = require("../../database/entities/app-release.entity");
const app_version_entity_1 = require("../../database/entities/app-version.entity");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const user_entity_1 = require("../../database/entities/user.entity");
let SystemService = class SystemService {
    db;
    versions;
    releases;
    audits;
    users;
    restoring = false;
    constructor(db, versions, releases, audits, users) {
        this.db = db;
        this.versions = versions;
        this.releases = releases;
        this.audits = audits;
        this.users = users;
    }
    publicVersion(app) {
        return this.versions
            .findOneBy({ app })
            .then((row) => row || { app, version: null, updatedAt: null });
    }
    listVersions() {
        return this.versions.find({ order: { app: "ASC" } });
    }
    async updateVersion(app, input) {
        if (!(0, cmb_system_1.isValidAppVersion)(input.version))
            throw new api_exception_1.ApiException(400, "VERSION_INVALID", "نسخه معتبر نیست.");
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
    async updateRelease(app, input) {
        const version = await this.updateVersion(app, input);
        return this.releases.save(this.releases.create({
            app,
            version: version.version,
            notes: input.notes || "",
        }));
    }
    auditLogs() {
        return this.audits
            .find({
            relations: { user: true },
            order: { createdAt: "DESC" },
            take: 200,
        })
            .then((rows) => rows.map((row) => (0, cmb_system_1.projectAuditRecord)({
            id: row.id,
            action: row.action,
            entity: row.entity,
            actorUserId: row.user?.id,
            metadata: row.metadata,
            createdAt: row.createdAt,
        })));
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
            sizeBytes: node_fs_1.default.statSync(file).size,
            path: node_path_1.default.basename(file),
            migrations: Number(migrations[0]?.n || 0),
            remoteRestoreEnabled: process.env.ALLOW_REMOTE_DATABASE_RESTORE === "true",
        }));
    }
    async backup(actorId) {
        const root = this.tempRoot(), file = node_path_1.default.join(root, `snapshot-${(0, node_crypto_1.randomBytes)(8).toString("hex")}.sqlite`);
        await this.db.query(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
        this.validate(file);
        const buffer = node_fs_1.default.readFileSync(file);
        node_fs_1.default.unlinkSync(file);
        await this.audit(actorId, "database.backup.created", {
            sizeBytes: buffer.length,
        });
        return {
            buffer,
            filename: `moshaver-v2-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`,
        };
    }
    async restore(actorId, buffer) {
        if (process.env.ALLOW_REMOTE_DATABASE_RESTORE !== "true")
            throw new api_exception_1.ApiException(403, "RESTORE_DISABLED", "بازیابی از راه دور غیرفعال است.");
        if (this.restoring)
            throw new api_exception_1.ApiException(409, "RESTORE_IN_PROGRESS", "بازیابی دیگری در حال اجرا است.");
        const max = Number(process.env.MAX_RESTORE_BODY || 64 * 1024 * 1024);
        if (!Buffer.isBuffer(buffer) || buffer.length < 4096 || buffer.length > max)
            throw new api_exception_1.ApiException(400, "RESTORE_SIZE_INVALID", "اندازه فایل بازیابی معتبر نیست.");
        this.restoring = true;
        const token = (0, node_crypto_1.randomBytes)(8).toString("hex"), root = this.tempRoot(), upload = node_path_1.default.join(root, `restore-${token}.sqlite`), rollback = node_path_1.default.join(root, `rollback-${token}.sqlite`), target = this.databasePath(), next = `${target}.restore-next-${token}`;
        try {
            node_fs_1.default.writeFileSync(upload, buffer, { mode: 0o600 });
            const inspected = this.validate(upload);
            await this.db.query(`VACUUM INTO '${rollback.replace(/'/g, "''")}'`);
            await this.audit(actorId, "database.restore.started", {
                sizeBytes: buffer.length,
            });
            await this.db.destroy();
            node_fs_1.default.copyFileSync(upload, next);
            node_fs_1.default.renameSync(next, target);
            for (const suffix of ["-wal", "-shm"])
                try {
                    node_fs_1.default.unlinkSync(target + suffix);
                }
                catch (error) {
                    if (error.code !== "ENOENT")
                        throw error;
                }
            try {
                await this.db.initialize();
                await this.db.query(`PRAGMA quick_check`);
            }
            catch (error) {
                if (this.db.isInitialized)
                    await this.db.destroy();
                node_fs_1.default.copyFileSync(rollback, target);
                await this.db.initialize();
                throw error;
            }
            await this.audit(actorId, "database.restore.completed", {
                sizeBytes: buffer.length,
                tables: inspected.tables,
                rollbackFilename: node_path_1.default.basename(rollback),
            });
            return {
                restored: true,
                sizeBytes: buffer.length,
                tables: inspected.tables,
                rollbackFilename: node_path_1.default.basename(rollback),
            };
        }
        finally {
            this.restoring = false;
            for (const file of [upload, next])
                try {
                    node_fs_1.default.unlinkSync(file);
                }
                catch (error) {
                    if (error.code !== "ENOENT")
                        throw error;
                }
        }
    }
    async resetSystemData(actor) {
        const platformAccounts = (await this.db.query(`SELECT DISTINCT u.id FROM users u LEFT JOIN user_role_assignments assignment ON assignment.userId=u.id LEFT JOIN roles role ON role.id=assignment.roleId WHERE u.isPlatformOwner=1 OR role.code='PLATFORM_ADMIN'`));
        const protectedUserIds = [
            ...new Set(platformAccounts.map((row) => row.id)),
        ];
        if (!protectedUserIds.includes(actor.id))
            throw new api_exception_1.ApiException(403, "PLATFORM_OWNER_REQUIRED", "حساب مدیر پلتفرم معتبر نیست.");
        const tableRows = (await this.db.query(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`));
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
                await manager.query(`DELETE FROM users WHERE id NOT IN (${protectedMarks})`, protectedUserIds);
                if (tables.has("user_role_assignments"))
                    for (const userId of protectedUserIds)
                        await manager.query(`INSERT INTO user_role_assignments(id,userId,roleId,membershipId) SELECT lower(hex(randomblob(16))),?,id,NULL FROM roles WHERE code='PLATFORM_ADMIN'`, [userId]);
                if (tables.has("platform_enrollment_settings")) {
                    await manager.query("DELETE FROM platform_enrollment_settings");
                    await manager.query("INSERT INTO platform_enrollment_settings (id, publicStudentSignupEnabled) VALUES (1, 0)");
                }
            });
        }
        finally {
            await this.db.query("PRAGMA foreign_keys = ON");
        }
        const quickCheck = await this.db.query(`PRAGMA quick_check`);
        if (quickCheck[0]?.quick_check !== "ok")
            throw new api_exception_1.ApiException(500, "RESET_INTEGRITY_FAILED", "بازنشانی انجام شد اما بررسی یکپارچگی ناموفق بود.");
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
    identifier(value) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    validate(file) {
        const db = new better_sqlite3_1.default(file, { readonly: true, fileMustExist: true });
        try {
            const check = db.pragma("quick_check", { simple: true });
            if (check !== "ok")
                throw new api_exception_1.ApiException(400, "SQLITE_INVALID", "فایل SQLite سالم نیست.");
            const tables = db
                .prepare(`SELECT name FROM sqlite_master WHERE type='table'`)
                .all().map((item) => item.name);
            for (const required of ["users", "students", "plans", "migrations"])
                if (!tables.includes(required))
                    throw new api_exception_1.ApiException(400, "SCHEMA_INVALID", `جدول الزامی ${required} وجود ندارد.`);
            return { tables: tables.length };
        }
        finally {
            db.close();
        }
    }
    databasePath() {
        const value = this.db.options.type === "better-sqlite3" ? this.db.options.database : "";
        if (typeof value !== "string" || !node_path_1.default.isAbsolute(value))
            throw new api_exception_1.ApiException(500, "DATABASE_PATH_INVALID", "مسیر پایگاه داده معتبر نیست.");
        return value;
    }
    tempRoot() {
        const root = node_path_1.default.join(node_os_1.default.tmpdir(), "moshaver-v2-backups");
        node_fs_1.default.mkdirSync(root, { recursive: true, mode: 0o700 });
        return root;
    }
    async audit(userId, action, metadata) {
        const user = await this.users.findOneBy({ id: userId });
        await this.audits.save(this.audits.create({ user, action, entity: "database", metadata }));
    }
};
exports.SystemService = SystemService;
exports.SystemService = SystemService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(app_version_entity_1.AppVersion)),
    __param(2, (0, typeorm_1.InjectRepository)(app_release_entity_1.AppRelease)),
    __param(3, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SystemService);
//# sourceMappingURL=system.service.js.map