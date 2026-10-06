import { MigrationInterface, QueryRunner } from "typeorm";

export class StudentExtendedFields1728230400000 implements MigrationInterface {
  name = "StudentExtendedFields1728230400000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Add fields to students table one at a time (better-sqlite3 doesn't support multiple ADD COLUMN)
    await queryRunner.query(`ALTER TABLE students ADD COLUMN shenasnameNumber VARCHAR(20) NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN birthDate DATETIME NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN birthPlace VARCHAR(120) NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN certificateIssuePlace VARCHAR(120) NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN gender VARCHAR(24) NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN educationLevel VARCHAR(40) NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN previousSchoolInfo TEXT NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN schoolReport TEXT NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN residenceAddress TEXT NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN postalCode VARCHAR(10) NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN homePhone VARCHAR(24) NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN mobileNumber VARCHAR(24) NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN fatherName VARCHAR(160) NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN fatherNationalCode VARCHAR(10) NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN fatherOccupation VARCHAR(160) NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN motherName VARCHAR(160) NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN motherNationalCode VARCHAR(10) NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN motherOccupation VARCHAR(160) NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN legalGuardianInfo TEXT NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN emergencyContact VARCHAR(24) NULL`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN hasShenasnameImage BOOLEAN DEFAULT FALSE`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN hasNationalCardImage BOOLEAN DEFAULT FALSE`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN hasParentDocuments BOOLEAN DEFAULT FALSE`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN hasPersonalPhoto BOOLEAN DEFAULT FALSE`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN hasHealthRecord BOOLEAN DEFAULT FALSE`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN hasVaccinationRecord BOOLEAN DEFAULT FALSE`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN hasInsuranceInfo BOOLEAN DEFAULT FALSE`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN hasConsentForms BOOLEAN DEFAULT FALSE`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN hasTransportInfo BOOLEAN DEFAULT FALSE`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN hasTuitionInfo BOOLEAN DEFAULT FALSE`);
    await queryRunner.query(`ALTER TABLE students ADD COLUMN hasLegalGuardianSignature BOOLEAN DEFAULT FALSE`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Remove fields from students table
    await queryRunner.query(`
      ALTER TABLE students 
      DROP COLUMN shenasnameNumber,
      DROP COLUMN birthDate,
      DROP COLUMN birthPlace,
      DROP COLUMN certificateIssuePlace,
      DROP COLUMN gender,
      DROP COLUMN educationLevel,
      DROP COLUMN previousSchoolInfo,
      DROP COLUMN schoolReport,
      DROP COLUMN residenceAddress,
      DROP COLUMN postalCode,
      DROP COLUMN homePhone,
      DROP COLUMN mobileNumber,
      DROP COLUMN fatherName,
      DROP COLUMN fatherNationalCode,
      DROP COLUMN fatherOccupation,
      DROP COLUMN motherName,
      DROP COLUMN motherNationalCode,
      DROP COLUMN motherOccupation,
      DROP COLUMN legalGuardianInfo,
      DROP COLUMN emergencyContact,
      DROP COLUMN hasShenasnameImage,
      DROP COLUMN hasNationalCardImage,
      DROP COLUMN hasParentDocuments,
      DROP COLUMN hasPersonalPhoto,
      DROP COLUMN hasHealthRecord,
      DROP COLUMN hasVaccinationRecord,
      DROP COLUMN hasInsuranceInfo,
      DROP COLUMN hasConsentForms,
      DROP COLUMN hasTransportInfo,
      DROP COLUMN hasTuitionInfo,
      DROP COLUMN hasLegalGuardianSignature
    `);
  }
}
