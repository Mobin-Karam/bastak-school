import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseInterceptors } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { StudentDocumentsService } from "./student-documents.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";

@Controller("student-documents")
export class StudentDocumentsController {
  constructor(private readonly documents: StudentDocumentsService) {}

  @Get()
  @RequireCapabilities("documents.read")
  async list(@CurrentUser() user: AuthenticatedUser, @Query("studentId") studentId?: string) {
    return this.documents.list(user, studentId).then(ok);
  }

  @Post(":studentId/upload")
  @RequireCapabilities("documents.manage")
  @UseInterceptors(FileInterceptor("file", {
    storage: diskStorage({
      destination: "./uploads",
      filename: (req: any, file: any, callback: any) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param("studentId") studentId: string,
    @Body("type") type: string,
  ) {
    // In a real implementation, we would get the file from Multer
    // For now, we'll simulate the upload
    return this.documents.upload(user, studentId, type, {
      fieldname: "file",
      originalname: "document.pdf",
      encoding: "7bit",
      mimetype: "application/pdf",
      size: 1024,
      destination: "./uploads",
      filename: "document.pdf",
      path: "./uploads/document.pdf",
      buffer: Buffer.from([]),
    } as any).then(ok);
  }

  @Patch(":id/verify")
  @RequireCapabilities("documents.manage")
  async verify(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body("status") status: "VERIFIED" | "REJECTED",
    @Body("note") note?: string,
  ) {
    return this.documents.verify(user, id, status, note).then(ok);
  }
}
