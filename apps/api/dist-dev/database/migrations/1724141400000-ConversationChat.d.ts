import { MigrationInterface, QueryRunner } from "typeorm";
export declare class ConversationChat1724141400000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(q: QueryRunner): Promise<void>;
}
