import { MigrationInterface, QueryRunner } from "typeorm";
export declare class TimetableImportSourceRows1731100000000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
