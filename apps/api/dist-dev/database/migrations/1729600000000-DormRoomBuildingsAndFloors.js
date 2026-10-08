"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DormRoomBuildingsAndFloors1729600000000 = void 0;
class DormRoomBuildingsAndFloors1729600000000 {
    async up(queryRunner) {
        await queryRunner.query("ALTER TABLE dorm_rooms ADD COLUMN building varchar(120) NOT NULL DEFAULT 'ساختمان اصلی'");
        await queryRunner.query("ALTER TABLE dorm_rooms ADD COLUMN floor integer NOT NULL DEFAULT 1");
    }
    async down(queryRunner) {
        await queryRunner.query("ALTER TABLE dorm_rooms DROP COLUMN floor");
        await queryRunner.query("ALTER TABLE dorm_rooms DROP COLUMN building");
    }
}
exports.DormRoomBuildingsAndFloors1729600000000 = DormRoomBuildingsAndFloors1729600000000;
//# sourceMappingURL=1729600000000-DormRoomBuildingsAndFloors.js.map