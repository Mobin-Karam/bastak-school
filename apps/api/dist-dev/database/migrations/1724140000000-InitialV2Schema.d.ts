import { MigrationInterface, QueryRunner } from "typeorm";
export declare class InitialV2Schema1724140000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
