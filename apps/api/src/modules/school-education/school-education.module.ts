import { SchoolAccessModule } from "../school-access";
import { AcademicService } from "./academic.service";
import { AcademicController } from "./academic.controller";
import { Module } from "@nestjs/common";
import { ClassesModule } from "../classes/classes.module";
import { ClassGroupsModule } from "../class-groups/class-groups.module";
import { EducationCatalogModule } from "../education-catalog/education-catalog.module";

@Module({
  imports: [
    EducationCatalogModule,
    ClassesModule,
    ClassGroupsModule,
    SchoolAccessModule,
  ],
  providers: [AcademicService],
  controllers: [AcademicController],
  exports: [EducationCatalogModule, ClassesModule, ClassGroupsModule],
})
export class SchoolEducationModule {}
