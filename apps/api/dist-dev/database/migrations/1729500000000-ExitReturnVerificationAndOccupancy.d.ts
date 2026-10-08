import { MigrationInterface, QueryRunner } from "typeorm";
export declare class ExitReturnVerificationAndOccupancy1729500000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
