import { MigrationInterface, QueryRunner } from "typeorm";
export declare class QuestionBankProvenance1724146800000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
