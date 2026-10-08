import { MigrationInterface, QueryRunner } from "typeorm";
export declare class UserCapabilityGrants1728300100000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(q: QueryRunner): Promise<void>;
}
