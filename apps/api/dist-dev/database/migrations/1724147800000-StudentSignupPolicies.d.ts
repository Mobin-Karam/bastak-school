import { MigrationInterface, QueryRunner } from "typeorm";
export declare class StudentSignupPolicies1724147800000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
