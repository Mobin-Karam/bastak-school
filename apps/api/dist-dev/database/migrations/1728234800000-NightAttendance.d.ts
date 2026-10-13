import { MigrationInterface, QueryRunner } from "typeorm";
export declare class NightAttendance1728234800000 implements MigrationInterface {
    name: string;
    up(_queryRunner: QueryRunner): Promise<void>;
    down(_queryRunner: QueryRunner): Promise<void>;
}
