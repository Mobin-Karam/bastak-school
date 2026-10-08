import type { MigrationInterface, QueryRunner } from "typeorm";
export declare class StudentGuardianSelection1724144400000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
