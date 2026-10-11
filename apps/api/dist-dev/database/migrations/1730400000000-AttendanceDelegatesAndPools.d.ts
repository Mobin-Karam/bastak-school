import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AttendanceDelegatesAndPools1730400000000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(q: QueryRunner): Promise<void>;
}
