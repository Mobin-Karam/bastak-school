import { Module } from "@nestjs/common";
import { ClassesModule } from "../classes/classes.module";
import { ClassGroupsModule } from "../class-groups/class-groups.module";
import { EducationCatalogModule } from "../education-catalog/education-catalog.module";

@Module({
  imports: [EducationCatalogModule, ClassesModule, ClassGroupsModule],
  exports: [EducationCatalogModule, ClassesModule, ClassGroupsModule],
})
export class SchoolEducationModule {}
