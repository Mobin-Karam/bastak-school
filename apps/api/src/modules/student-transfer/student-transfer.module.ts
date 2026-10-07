import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Student } from "../../database/entities/student.entity";
import { ImportHistory } from "../../database/entities/import-history.entity";
import { SchoolAccessModule } from "../school-access/school-access.module";
import { StudentTransferController } from "./student-transfer.controller";
import { StudentTransferService } from "./student-transfer.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, ImportHistory]),
    SchoolAccessModule,
  ],
  controllers: [StudentTransferController],
  providers: [StudentTransferService],
})
export class StudentTransferModule {}
