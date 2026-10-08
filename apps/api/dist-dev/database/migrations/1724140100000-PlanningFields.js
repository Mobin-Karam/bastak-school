"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanningFields1724140100000 = void 0;
class PlanningFields1724140100000 {
    name = "PlanningFields1724140100000";
    async up(queryRunner) {
        await addColumnIfMissing(queryRunner, "tasks", "subject", "varchar NOT NULL DEFAULT ('')");
        await addColumnIfMissing(queryRunner, "tasks", "startTime", "varchar NOT NULL DEFAULT ('')");
        await addColumnIfMissing(queryRunner, "tasks", "endTime", "varchar NOT NULL DEFAULT ('')");
        await addColumnIfMissing(queryRunner, "tasks", "testCount", "integer NOT NULL DEFAULT (0)");
        await addColumnIfMissing(queryRunner, "tasks", "note", "varchar NOT NULL DEFAULT ('')");
        await addColumnIfMissing(queryRunner, "tasks", "status", "varchar(24) NOT NULL DEFAULT ('PLANNED')");
    }
    async down() {
    }
}
exports.PlanningFields1724140100000 = PlanningFields1724140100000;
async function addColumnIfMissing(queryRunner, tableName, columnName, definition) {
    const columns = (await queryRunner.query(`PRAGMA table_info(${tableName})`));
    if (!columns.some((column) => column.name === columnName)) {
        await queryRunner.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    }
}
//# sourceMappingURL=1724140100000-PlanningFields.js.map