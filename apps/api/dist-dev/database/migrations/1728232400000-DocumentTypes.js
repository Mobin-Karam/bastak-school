"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentTypes1728232400000 = void 0;
class DocumentTypes1728232400000 {
    name = "DocumentTypes1728232400000";
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS document_types (
        id varchar PRIMARY KEY NOT NULL,
        code varchar(48) NOT NULL,
        name varchar(160) NOT NULL,
        description text NOT NULL DEFAULT '',
        enabled boolean NOT NULL DEFAULT true,
        required boolean NOT NULL DEFAULT false,
        sortOrder integer NOT NULL DEFAULT 0,
        instructions text NOT NULL DEFAULT '',
        requiresVerification boolean NOT NULL DEFAULT false,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS IDX_document_types_code
      ON document_types(code)
    `);
        const documentTypes = [
            { code: "SHENASNAME", name: "شناسنامه", description: "تصویر شناسنامه دانش‌آموز", instructions: "لطفاً تصویر واضح و کامل شناسنامه را آپلود کنید", requiresVerification: true },
            { code: "NATIONAL_CARD", name: "کارت ملی", description: "تصویر کارت ملی دانش‌آموز", instructions: "لطفاً تصویر واضح و کامل کارت ملی را آپلود کنید", requiresVerification: true },
            { code: "PARENT_DOCUMENTS", name: "مدارک والدین", description: "تصویر شناسنامه یا کارت ملی والدین", instructions: "لطفاً تصویر واضح و کامل مدارک والدین را آپلود کنید", requiresVerification: true },
            { code: "PERSONAL_PHOTO", name: "عکس پرسنلی", description: "عکس پرسنلی دانش‌آموز", instructions: "لطفاً عکس پرسنلی با پس‌زمینه سفید را آپلود کنید", requiresVerification: true },
            { code: "HEALTH_RECORD", name: "پرونده سلامت", description: "پرونده سلامت / اطلاعات پزشکی", instructions: "لطفاً اطلاعات پزشکی و سلامت را آپلود کنید", requiresVerification: true },
            { code: "VACCINATION_RECORD", name: "واکسیناسیون", description: "وضعیت واکسیناسیون", instructions: "لطفاً وضعیت واکسیناسیون را آپلود کنید", requiresVerification: true },
            { code: "INSURANCE_INFO", name: "اطلاعات بیمه", description: "اطلاعات بیمه", instructions: "لطفاً اطلاعات بیمه را آپلود کنید", requiresVerification: true },
            { code: "CONSENT_FORMS", name: "رضایت‌نامه‌ها", description: "رضایت‌نامه‌ها و تعهدنامه‌ها", instructions: "لطفاً رضایت‌نامه‌ها و تعهدنامه‌ها را آپلود کنید", requiresVerification: true },
            { code: "TRANSPORT_INFO", name: "سرویس مدرسه", description: "اطلاعات سرویس مدرسه", instructions: "لطفاً اطلاعات سرویس مدرسه را آپلود کنید", requiresVerification: false },
            { code: "TUITION_INFO", name: "شهریه", description: "اطلاعات پرداخت شهریه", instructions: "لطفاً اطلاعات پرداخت شهریه را آپلود کنید", requiresVerification: false },
            { code: "LEGAL_GUARDIAN_SIGNATURE", name: "امضای ولی", description: "امضای ولی یا سرپرست قانونی", instructions: "لطفاً امضای ولی یا سرپرست قانونی را آپلود کنید", requiresVerification: true },
        ];
        for (const docType of documentTypes) {
            await queryRunner.query(`INSERT OR IGNORE INTO document_types(id, code, name, description, instructions, requiresVerification) VALUES(lower(hex(randomblob(16))), ?, ?, ?, ?, ?)`, [docType.code, docType.name, docType.description, docType.instructions, docType.requiresVerification ? 1 : 0]);
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE document_types`);
    }
}
exports.DocumentTypes1728232400000 = DocumentTypes1728232400000;
//# sourceMappingURL=1728232400000-DocumentTypes.js.map