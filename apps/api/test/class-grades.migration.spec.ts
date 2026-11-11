import "reflect-metadata";
import { migratedDatabase } from "./helpers/migrated-database";

describe("Class book grade migration", () => {
  it("creates the grade store and grants only the intended role capabilities", async () => {
    const db = await migratedDatabase();
    try {
      expect(
        await db.query(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='class_book_grades'`,
        ),
      ).toHaveLength(1);
      expect(
        await db.query(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='class_book_grade_sessions'`,
        ),
      ).toHaveLength(1);
      const granted: Array<{ role: string; code: string }> = await db.query(
        `SELECT r.code role, p.code code FROM role_permissions rp JOIN roles r ON r.id=rp.roleId JOIN permissions p ON p.id=rp.permissionId WHERE p.code LIKE 'class_grades.%' ORDER BY r.code,p.code`,
      );
      expect(granted).toEqual([
        { role: "PRINCIPAL", code: "class_grades.manage" },
        { role: "PRINCIPAL", code: "class_grades.read" },
        { role: "RELIGIOUS_EDUCATION_MANAGER", code: "class_grades.read" },
        { role: "STUDENT", code: "class_grades.self.read" },
        { role: "TEACHER", code: "class_grades.manage" },
        { role: "TEACHER", code: "class_grades.read" },
      ]);
    } finally {
      await db.destroy();
    }
  });
});
