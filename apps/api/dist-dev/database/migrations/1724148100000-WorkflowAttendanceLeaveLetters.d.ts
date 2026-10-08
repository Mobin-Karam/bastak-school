import { MigrationInterface, QueryRunner } from "typeorm";
export declare class WorkflowAttendanceLeaveLetters1724148100000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(q: QueryRunner): Promise<void>;
}
