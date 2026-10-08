import type { MigrationInterface, QueryRunner } from "typeorm";
export declare class PlatformAdminChat1724143500000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
