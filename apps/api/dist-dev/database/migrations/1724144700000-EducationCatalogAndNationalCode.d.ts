import { MigrationInterface, QueryRunner } from "typeorm";
export declare class EducationCatalogAndNationalCode1724144700000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(q: QueryRunner): Promise<void>;
}
