import { MigrationInterface, QueryRunner } from "typeorm";
export declare class DocumentTypes1728232400000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
