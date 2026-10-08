import { MigrationInterface, QueryRunner } from "typeorm";
export declare class RoleContextHardening1724142200000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(q: QueryRunner): Promise<void>;
}
