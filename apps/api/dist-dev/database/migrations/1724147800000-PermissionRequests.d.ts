import { MigrationInterface, QueryRunner } from "typeorm";
export declare class PermissionRequests1724147800000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(q: QueryRunner): Promise<void>;
}
