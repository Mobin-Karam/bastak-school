import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AttendanceSessionLifecycle1730200000000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
