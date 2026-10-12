import { MigrationInterface, QueryRunner } from "typeorm";
export declare class OrganizationAuthProfiles1730300000000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(q: QueryRunner): Promise<void>;
}
