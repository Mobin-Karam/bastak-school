import { MigrationInterface, QueryRunner } from "typeorm";
export declare class PlanningRoleCapabilities1724145400000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
