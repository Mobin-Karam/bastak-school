import { MigrationInterface, QueryRunner } from "typeorm";
export declare class SyncMutations1724140400000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
