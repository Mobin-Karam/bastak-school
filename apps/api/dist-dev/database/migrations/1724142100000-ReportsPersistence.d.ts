import { MigrationInterface, QueryRunner } from "typeorm";
export declare class ReportsPersistence1724142100000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
