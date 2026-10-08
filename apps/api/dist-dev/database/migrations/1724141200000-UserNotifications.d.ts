import { MigrationInterface, QueryRunner } from "typeorm";
export declare class UserNotifications1724141200000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
