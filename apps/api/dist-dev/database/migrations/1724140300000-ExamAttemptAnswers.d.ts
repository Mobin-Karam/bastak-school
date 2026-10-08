import { MigrationInterface, QueryRunner } from "typeorm";
export declare class ExamAttemptAnswers1724140300000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
