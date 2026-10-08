import { MigrationInterface, QueryRunner } from "typeorm";
export declare class SignupThrottle1724143400000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(q: QueryRunner): Promise<void>;
}
