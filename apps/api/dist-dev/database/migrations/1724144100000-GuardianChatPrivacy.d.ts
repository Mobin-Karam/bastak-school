import type { MigrationInterface, QueryRunner } from "typeorm";
export declare class GuardianChatPrivacy1724144100000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
