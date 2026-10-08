import type { MigrationInterface, QueryRunner } from "typeorm";
export declare class ChatUserProfiles1724144200000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
