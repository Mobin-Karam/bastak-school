import { MigrationInterface, QueryRunner } from "typeorm";
export declare class StudentExamExperience1724143100000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
