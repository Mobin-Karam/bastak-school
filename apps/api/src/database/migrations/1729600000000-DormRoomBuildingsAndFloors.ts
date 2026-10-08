import { MigrationInterface, QueryRunner } from "typeorm";

export class DormRoomBuildingsAndFloors1729600000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE dorm_rooms ADD COLUMN building varchar(120) NOT NULL DEFAULT 'ساختمان اصلی'");
    await queryRunner.query("ALTER TABLE dorm_rooms ADD COLUMN floor integer NOT NULL DEFAULT 1");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE dorm_rooms DROP COLUMN floor");
    await queryRunner.query("ALTER TABLE dorm_rooms DROP COLUMN building");
  }
}
