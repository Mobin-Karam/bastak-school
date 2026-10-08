"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionBankItems1724146700000 = void 0;
class QuestionBankItems1724146700000 {
    name = "QuestionBankItems1724146700000";
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE question_bank_items (id varchar PRIMARY KEY NOT NULL, text varchar NOT NULL, options text NOT NULL, correctAnswer varchar NOT NULL, explanation varchar NOT NULL DEFAULT (''), subject varchar NOT NULL DEFAULT (''), topic varchar NOT NULL DEFAULT (''), book varchar NOT NULL DEFAULT (''), grade varchar NOT NULL DEFAULT (''), chapter varchar NOT NULL DEFAULT (''), lesson varchar NOT NULL DEFAULT (''), difficulty varchar NOT NULL DEFAULT (''), source varchar NOT NULL DEFAULT (''), tags text NOT NULL DEFAULT ('[]'), archivedAt datetime, createdAt datetime NOT NULL DEFAULT (datetime('now')), updatedAt datetime NOT NULL DEFAULT (datetime('now')), organizationId varchar, CONSTRAINT FK_question_bank_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE)`);
        await queryRunner.query(`CREATE INDEX IDX_question_bank_organization_archived ON question_bank_items(organizationId, archivedAt)`);
        await queryRunner.query(`INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),'question_bank.manage','Manage reusable assessment questions')`);
        await queryRunner.query(`INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r CROSS JOIN permissions p WHERE p.code='question_bank.manage' AND r.code IN ('TEACHER','ADVISOR','MENTOR','ORGANIZATION_ADMIN','PLATFORM_ADMIN')`);
    }
    async down(queryRunner) { await queryRunner.query(`DROP TABLE question_bank_items`); }
}
exports.QuestionBankItems1724146700000 = QuestionBankItems1724146700000;
//# sourceMappingURL=1724146700000-QuestionBankItems.js.map