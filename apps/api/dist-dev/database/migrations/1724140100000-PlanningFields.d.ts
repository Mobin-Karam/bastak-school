import { MigrationInterface, QueryRunner } from "typeorm";
export declare class PlanningFields1724140100000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
