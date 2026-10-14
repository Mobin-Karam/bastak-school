import { MigrationInterface, QueryRunner } from "typeorm";
export declare class DatabaseRelationshipIntegrity1730700000000 implements MigrationInterface {
    name: string;
    transaction: boolean;
    up(q: QueryRunner): Promise<void>;
    private preflight;
    private rebuildTable;
    down(): Promise<void>;
}
