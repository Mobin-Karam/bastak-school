import { migratedDatabase } from "./helpers/migrated-database";
import { DataSource } from "typeorm";
import { EducationCatalogService } from "../src/modules/education-catalog/education-catalog.service";
import { User, UserRole } from "../src/database/entities/user.entity";
import { Organization, OrganizationType } from "../src/database/entities/organization.entity";
import { EducationBook } from "../src/database/entities/education-book.entity";
import { EducationClass } from "../src/database/entities/education-class.entity";
import { EducationClassBook } from "../src/database/entities/education-class-book.entity";
import { SchoolScheduleEntry } from "../src/database/entities/school-schedule-entry.entity";
import { TimetableAcademicYear, TimetableTerm, TimetableVersion, TimetableAllocation } from "../src/database/entities/timetable.entity";
import { AuditLog } from "../src/database/entities/audit-log.entity";
import { Student } from "../src/database/entities/student.entity";
import { OrganizationMembership } from "../src/database/entities/organization-membership.entity";
import type { AuthenticatedUser } from "../src/modules/auth";

describe("catalog deletion synchronizes class assignments (migration-built SQLite)", () => {
 let db: DataSource, service: EducationCatalogService, actor: AuthenticatedUser, book: EducationBook, links: EducationClassBook[];
 beforeEach(async () => {
  db = await migratedDatabase();
  const user = await db.manager.save(User, db.manager.create(User, { username: "book-manager", passwordHash: "fixture", role: UserRole.ORGANIZATION_ADMIN }));
  const org = await db.manager.save(Organization, db.manager.create(Organization, { name: "School", type: OrganizationType.SCHOOL }));
  actor = { id: user.id, username: user.username, role: "PRINCIPAL", roles: ["PRINCIPAL"], sessionId: "fixture", organizationIds: [org.id], activeOrganizationId: org.id, capabilities: ["education.catalog.manage"] };
  book = await db.manager.save(EducationBook, db.manager.create(EducationBook, { id: "owned", organizationId: org.id, country: "IR", schoolYear: "1405", grade: 1, level: "school", branch: "general", track: "general", category: "درس", titleFa: "Book", titleEn: "Book", appliesTo: [], state: "PUBLISHED" }));
  links = [];
  for (const code of ["a", "b"]) {
   const classroom = await db.manager.save(EducationClass, db.manager.create(EducationClass, { organization: org, code, name: code, schoolYear: "1405", gradeId: 1, educationTypeId: "school", trackId: "general" }));
   links.push(await db.manager.save(EducationClassBook, db.manager.create(EducationClassBook, { classroom, book, teacher: user })));
  }
  service = new EducationCatalogService(db.getRepository(EducationBook), db.getRepository(Student), db.getRepository(AuditLog), db.getRepository(OrganizationMembership));
 });
 afterEach(async () => { if(db?.isInitialized) await db.destroy(); });
 it("retires the book and removes every linked class assignment atomically", async () => {
  const other = await db.manager.save(EducationBook, { ...book, id: "unselected" });
  await db.manager.save(EducationClassBook, { classroom: links[0].classroom, book: other, teacher: {id: actor.id} });
  expect((await service.updateBook(actor, book.id, {state: "ARCHIVED"})).state).toBe("ARCHIVED");
  expect(await db.manager.count(EducationClassBook)).toBe(1);
  expect((await service.listBooks(undefined, undefined, undefined, actor.organizationIds)).map(row=>row.id)).toEqual(["unselected"]);
  expect(await db.manager.countBy(AuditLog, {action: "education.catalog_book_deleted"})).toBe(1);
  expect(await db.query("PRAGMA foreign_key_check")).toEqual([]);
 });
 it("cleans existing archived books that still have class assignments", async () => {
  await db.manager.update(EducationBook, book.id, {state: "ARCHIVED"});
  await service.updateBook(actor, book.id, {state: "ARCHIVED"});
  expect(await db.manager.count(EducationClassBook)).toBe(0);
 });
 it("blocks timetable history without partially removing assignments or archiving the book", async () => {
  await db.manager.save(SchoolScheduleEntry, db.manager.create(SchoolScheduleEntry, { organization: {id: book.organizationId!}, classroom: links[0].classroom, classBook: links[0], teacher: {id: actor.id}, weekday: 0, startTime: "08:00", endTime: "09:00", title: "Retained lesson" }));
  await expect(service.updateBook(actor, book.id, {state: "ARCHIVED"})).rejects.toMatchObject({status:409});
  expect(await db.manager.count(EducationClassBook)).toBe(2);
  expect((await db.manager.findOneByOrFail(EducationBook,{id:book.id})).state).toBe("PUBLISHED");
  expect(await db.manager.count(AuditLog)).toBe(0);
 });
 it("blocks a weekly allocation even when there is no lesson yet", async () => {
  const year = await db.manager.save(TimetableAcademicYear, {organizationId:book.organizationId!,name:"Year",startsOn:"2026-01-01",endsOn:"2026-12-31",timeZone:"Asia/Tehran",active:true});
  const term = await db.manager.save(TimetableTerm, {yearId:year.id,name:"Term",startsOn:year.startsOn,endsOn:year.endsOn});
  const version = await db.manager.save(TimetableVersion, {termId:term.id,name:"Draft",effectiveOn:term.startsOn,createdById:actor.id,state:"DRAFT",revision:0,reason:"Fixture"});
  await db.manager.save(TimetableAllocation, {versionId:version.id,classroomId:links[0].classroom.id,classBookId:links[0].id,lessonsPerWeek:1});
  await expect(service.updateBook(actor,book.id,{state:"ARCHIVED"})).rejects.toMatchObject({status:409});
  expect(await db.manager.count(EducationClassBook)).toBe(2);
 });
 it("rolls back all removal when the audit write fails", async () => {
  await expect(service.updateBook({...actor,id:"nonexistent-audit-user"},book.id,{state:"ARCHIVED"})).rejects.toThrow();
  expect(await db.manager.count(EducationClassBook)).toBe(2);
  expect((await db.manager.findOneByOrFail(EducationBook,{id:book.id})).state).toBe("PUBLISHED");
 });
 it("rejects another school's deletion even when its own organization is supplied", async () => {
  const foreign = {...actor, organizationIds: ["foreign"]};
  await expect(service.updateBook(foreign,book.id,{state:"ARCHIVED",organizationId:"foreign"})).rejects.toMatchObject({status:403});
  expect(await db.manager.count(EducationClassBook)).toBe(2);
 });
 it("protects shared catalog books and requires the manage capability", async () => {
  await expect(service.updateBook({...actor,capabilities:[]},book.id,{state:"ARCHIVED"})).rejects.toMatchObject({status:403});
  await db.manager.update(EducationBook,book.id,{organizationId:null});
  await expect(service.updateBook(actor,book.id,{state:"ARCHIVED"})).rejects.toMatchObject({status:403});
  expect(await db.manager.count(EducationClassBook)).toBe(2);
 });
});
