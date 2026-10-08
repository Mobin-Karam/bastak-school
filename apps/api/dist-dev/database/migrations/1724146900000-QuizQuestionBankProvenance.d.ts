import { MigrationInterface, QueryRunner } from "typeorm";
export declare class QuizQuestionBankProvenance1724146900000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(q: QueryRunner): Promise<void>;
}
