import { MigrationInterface, QueryRunner } from "typeorm";
export declare class ChatMessageReadState1724140400000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
