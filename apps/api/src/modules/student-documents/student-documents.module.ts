import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StudentDocumentsService } from "./student-documents.service";
import { StudentDocument } from "../../database/entities/student-document.entity";
import { DocumentType } from "../../database/entities/document-type.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { SchoolAccessModule } from "../school-access/school-access.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentDocument,
      DocumentType,
      Student,
      User,
    ]),
    SchoolAccessModule,
  ],
  providers: [StudentDocumentsService],
  exports: [StudentDocumentsService],
})
export class StudentDocumentsModule {}
