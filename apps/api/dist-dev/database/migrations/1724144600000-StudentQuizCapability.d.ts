import { MigrationInterface, QueryRunner } from "typeorm";
export declare class StudentQuizCapability1724144600000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(q: QueryRunner): Promise<void>;
}
