import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { EducationCatalogService } from "./education-catalog.service";
import { ImportEducationBooksDto, SaveEducationBookDto, UpdateEducationBookDto } from "./education-catalog.dto";

@Controller("education-catalog")
export class EducationCatalogController {
  constructor(private readonly catalog: EducationCatalogService) {}
  @Get("signup-options") signupOptions() {
    return ok(this.catalog.signupOptions());
  }
  @Get("books") books(
    @Query("grade") grade?: string,
    @Query("educationTypeId") educationTypeId?: string,
    @Query("trackId") trackId?: string,
  ) {
    return this.catalog
      .listBooks(grade ? Number(grade) : undefined, educationTypeId, trackId)
      .then(ok);
  }
  @Get("my-books") @RequireCapabilities("student.profile.read") myBooks(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.catalog.booksForStudentUser(user.id).then(ok);
  }
  @Get("datasets") @RequireCapabilities("subjects.read") datasets() {
    return ok(this.catalog.datasets());
  }
  @Get("admin/overview") @RequireCapabilities("education.operations.read") overview(@CurrentUser() user: AuthenticatedUser, @Query("from") from?: string, @Query("to") to?: string, @Query("grade") grade?: string) {
    return this.catalog.operationsOverview(user, from, to, grade ? Number(grade) : undefined).then(ok);
  }
  @Get("admin/books") @RequireCapabilities("education.catalog.read") managedBooks(@CurrentUser() user: AuthenticatedUser, @Query("schoolYear") schoolYear?: string, @Query("state") state?: string) {
    return this.catalog.listManaged(user, schoolYear, state).then(ok);
  }
  @Get("admin/books/:id/impact") @RequireCapabilities("education.catalog.read") impact(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.catalog.bookImpact(user, id).then(ok);
  }
  @Post("admin/books") @RequireCapabilities("education.catalog.manage") createBook(@CurrentUser() user: AuthenticatedUser, @Body() dto: SaveEducationBookDto) {
    return this.catalog.createBook(user, dto).then(ok);
  }
  @Post("admin/books/import-preview") @RequireCapabilities("education.catalog.manage") importPreview(@CurrentUser() user: AuthenticatedUser, @Body() dto: ImportEducationBooksDto) { return this.catalog.previewImport(user, dto.books).then(ok); }
  @Post("admin/books/import-commit") @RequireCapabilities("education.catalog.manage") importCommit(@CurrentUser() user: AuthenticatedUser, @Body() dto: ImportEducationBooksDto) { return this.catalog.commitImport(user, dto.books).then(ok); }
  @Patch("admin/books/:id") @RequireCapabilities("education.catalog.manage") updateBook(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateEducationBookDto) {
    return this.catalog.updateBook(user, id, dto).then(ok);
  }
  @Post("admin/books/:id/publish") @RequireCapabilities("education.catalog.publish") publishBook(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.catalog.publishBook(user, id).then(ok);
  }
}
