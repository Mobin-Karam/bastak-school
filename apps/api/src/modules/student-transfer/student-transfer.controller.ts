import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { CommitStudentImportDto, PreviewStudentImportDto } from "./student-transfer.dto";
import { StudentTransferService } from "./student-transfer.service";

@Controller("students/transfer")
export class StudentTransferController {
  constructor(private readonly transfer: StudentTransferService) {}

  @Post("preview")
  @RequireCapabilities("students.import")
  preview(@CurrentUser() user: AuthenticatedUser, @Body() dto: PreviewStudentImportDto) { return this.transfer.preview(user, dto).then(ok); }

  @Post("commit")
  @RequireCapabilities("students.import")
  commit(@CurrentUser() user: AuthenticatedUser, @Body() dto: CommitStudentImportDto) { return this.transfer.commit(user, dto).then(ok); }

  @Get("export")
  @RequireCapabilities("students.export")
  export(@CurrentUser() user: AuthenticatedUser, @Query("organizationId") organizationId?: string) { return this.transfer.exportRows(user, organizationId).then(ok); }
}
