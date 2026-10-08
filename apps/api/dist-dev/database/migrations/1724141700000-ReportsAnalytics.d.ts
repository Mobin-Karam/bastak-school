import { MigrationInterface, QueryRunner } from "typeorm";
export declare class ReportsAnalytics1724141700000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(q: QueryRunner): Promise<void>;
}
