import { MigrationInterface, QueryRunner } from "typeorm";
export declare class PlanTemplateProvenance1724145700000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
