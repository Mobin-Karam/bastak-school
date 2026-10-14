import "reflect-metadata";
import { DataSource } from "typeorm";
import { migratedDatabase } from "./helpers/migrated-database";
import { TimetableImportIdempotency1731000000000 } from "../src/database/migrations/1731000000000-TimetableImportIdempotency";
import { TimetableImportSourceRows1731100000000 } from "../src/database/migrations/1731100000000-TimetableImportSourceRows";
import {
  Organization,
  OrganizationType,
} from "../src/database/entities/organization.entity";
import { User, UserRole } from "../src/database/entities/user.entity";
import {
  TimetableAcademicYear,
  TimetableTerm,
  TimetableVersion,
} from "../src/database/entities/timetable.entity";

describe("timetable import idempotency migration", () => {
  let db: DataSource;

  beforeEach(async () => {
    db = await migratedDatabase(true, ["1731000000000", "1731100000000"]);
  });
  afterEach(async () => {
    await db.destroy();
  });

  async function upgrade() {
    const q = db.createQueryRunner();
    await q.startTransaction();
    try {
      await new TimetableImportIdempotency1731000000000().up(q);
      await new TimetableImportSourceRows1731100000000().up(q);
      await q.commitTransaction();
    } catch (error) {
      await q.rollbackTransaction();
      throw error;
    } finally {
      await q.release();
    }
  }

  it("retains historical imports with unique legacy fingerprints", async () => {
    const org = await db.getRepository(Organization).save({
      name: "School",
      type: OrganizationType.SCHOOL,
    });
    const actor = await db.getRepository(User).save({
      username: "importer",
      passwordHash: "fixture",
      role: UserRole.ORGANIZATION_ADMIN,
    });
    const year = await db.getRepository(TimetableAcademicYear).save({
        organizationId: org.id,
        name: "1405",
        startsOn: "2026-01-01",
        endsOn: "2026-12-31",
        timeZone: "Asia/Tehran",
        active: true,
    });
    const term = await db.getRepository(TimetableTerm).save({
        yearId: year.id,
        name: "اول",
        startsOn: year.startsOn,
        endsOn: year.endsOn,
    });
    const version = await db.getRepository(TimetableVersion).save({
        termId: term.id,
        name: "پیش‌نویس",
        effectiveOn: year.startsOn,
        reason: "fixture",
        createdById: actor.id,
    });
    await db.query(
      `INSERT INTO timetable_imports(id,versionId,actorId,filename,sheetName,rowCount,revision) VALUES('legacy-import',?,?, 'legacy.xlsx','اصلی',1,1)`,
      [version.id, actor.id],
    );

    await upgrade();

    expect(
      await db.query(
        `SELECT fingerprint, sourceRows FROM timetable_imports WHERE id = 'legacy-import'`,
      ),
    ).toEqual([{ fingerprint: "legacy-legacy-import", sourceRows: "[]" }]);
    await expect(
      db.query(
        `INSERT INTO timetable_imports(id,versionId,actorId,filename,sheetName,fingerprint,rowCount,revision) VALUES('second',?,?, 'retry.xlsx','اصلی','legacy-legacy-import',1,1)`,
        [version.id, actor.id],
      ),
    ).rejects.toThrow();
  });
});
