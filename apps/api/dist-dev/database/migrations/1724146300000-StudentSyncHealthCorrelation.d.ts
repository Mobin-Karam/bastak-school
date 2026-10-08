import { MigrationInterface, QueryRunner } from "typeorm";
export declare class StudentSyncHealthCorrelation1724146300000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
