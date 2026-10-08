import { MigrationInterface, QueryRunner } from "typeorm";
export declare class SchoolRoles1728233600000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
