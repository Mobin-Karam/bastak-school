import { MigrationInterface, QueryRunner } from "typeorm";
export declare class StudentSyncHealth1724146000000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(q: QueryRunner): Promise<void>;
}
