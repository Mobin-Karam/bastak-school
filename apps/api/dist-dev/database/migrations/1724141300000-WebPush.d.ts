import { MigrationInterface, QueryRunner } from "typeorm";
export declare class WebPush1724141300000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(q: QueryRunner): Promise<void>;
}
