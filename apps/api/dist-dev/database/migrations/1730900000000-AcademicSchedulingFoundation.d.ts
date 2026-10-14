import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AcademicSchedulingFoundation1730900000000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
