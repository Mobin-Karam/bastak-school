import { MigrationInterface, QueryRunner } from "typeorm";
export declare class SyncMetadata1724142000000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
