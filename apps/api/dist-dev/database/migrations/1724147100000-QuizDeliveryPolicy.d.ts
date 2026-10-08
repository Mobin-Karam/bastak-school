import { MigrationInterface, QueryRunner } from "typeorm";
export declare class QuizDeliveryPolicy1724147100000 implements MigrationInterface {
    name: string;
    up(q: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
