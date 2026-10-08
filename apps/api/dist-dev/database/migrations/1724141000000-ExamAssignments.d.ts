import { MigrationInterface, QueryRunner } from "typeorm";
export declare class ExamAssignments1724141000000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(q: QueryRunner): Promise<void>;
}
