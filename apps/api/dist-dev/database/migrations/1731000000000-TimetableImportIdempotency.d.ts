import { MigrationInterface, QueryRunner } from "typeorm";
export declare class TimetableImportIdempotency1731000000000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
