import { MigrationInterface, QueryRunner } from "typeorm";
export declare class TaskFeedback1724140300000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
