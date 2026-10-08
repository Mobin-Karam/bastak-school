import { MigrationInterface, QueryRunner } from "typeorm";
export declare class StaffPlannerCapabilities1724142300000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(q: QueryRunner): Promise<void>;
}
