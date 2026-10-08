import { MigrationInterface, QueryRunner } from "typeorm";
export declare class Subjects1724140900000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(q: QueryRunner): Promise<void>;
}
