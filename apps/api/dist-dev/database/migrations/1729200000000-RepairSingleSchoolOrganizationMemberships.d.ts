import { MigrationInterface, QueryRunner } from "typeorm";
export declare class RepairSingleSchoolOrganizationMemberships1729200000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
