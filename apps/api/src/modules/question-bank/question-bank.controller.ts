import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { QuestionBankService } from "./question-bank.service";
import { GenerateExamFromBankDto } from "./question-bank.dto";
@Controller("question-bank")
export class QuestionBankController {
  constructor(private readonly service: QuestionBankService) {}
  private c(u: AuthenticatedUser) {
    return {
      ...u,
      roles: u.roles ?? [u.role],
      capabilities: u.capabilities ?? [],
      membershipIds: u.membershipIds ?? [],
      organizationIds: u.organizationIds ?? [],
    };
  }
  @Get() @RequireCapabilities("question_bank.manage") list(
    @CurrentUser() u: AuthenticatedUser,
    @Query("organizationId") org?: string,
    @Query("bankType") bankType?: "exam" | "quiz",
  ) {
    return this.service.list(this.c(u), org, bankType).then(ok);
  }
  @Get("template") @RequireCapabilities("question_bank.manage") template(
    @CurrentUser() u: AuthenticatedUser,
    @Query("bankType") bankType?: "exam" | "quiz",
  ) {
    return this.service.template(this.c(u), bankType).then(ok);
  }
  @Get("export") @RequireCapabilities("question_bank.manage") export(
    @CurrentUser() u: AuthenticatedUser,
    @Query("organizationId") org?: string,
    @Query("bankType") bankType?: "exam" | "quiz",
  ) {
    return this.service.export(this.c(u), org, bankType).then(ok);
  }
  @Post("import") @RequireCapabilities("question_bank.manage") import(
    @CurrentUser() u: AuthenticatedUser,
    @Body()
    body: { bankType?: "exam" | "quiz"; questions?: Record<string, unknown>[] },
  ) {
    return this.service.import(this.c(u), body).then(ok);
  }
  @Post() @RequireCapabilities("question_bank.manage") create(
    @CurrentUser() u: AuthenticatedUser,
    @Body() b: Record<string, unknown>,
  ) {
    return this.service.save(this.c(u), b).then(ok);
  }
  @Patch(":id") @RequireCapabilities("question_bank.manage") update(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Body() b: Record<string, unknown>,
  ) {
    return this.service.save(this.c(u), b, id).then(ok);
  }
  @Delete(":id") @RequireCapabilities("question_bank.manage") archive(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.service.archive(this.c(u), id).then(ok);
  }
  @Post(":id/add-to-exam")
  @RequireCapabilities("question_bank.manage", "questions.create")
  addToExam(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: { examId?: string },
  ) {
    if (!body.examId) throw new Error("examId is required");
    return this.service.copyToExam(this.c(u), id, body.examId).then(ok);
  }
  @Post("copy-exam-items-to-quiz-bank")
  @RequireCapabilities("question_bank.manage")
  copyExamItemsToQuizBank(
    @CurrentUser() u: AuthenticatedUser,
    @Body() body: { itemIds?: string[] },
  ) {
    if (!Array.isArray(body.itemIds) || !body.itemIds.length)
      throw new Error("itemIds is required");
    return this.service
      .copyExamItemsToQuizBank(this.c(u), body.itemIds)
      .then(ok);
  }
  @Post("generate/exam")
  @RequireCapabilities("question_bank.manage", "questions.create")
  generateExam(
    @CurrentUser() u: AuthenticatedUser,
    @Body() body: GenerateExamFromBankDto,
  ) {
    return this.service.generateExam(this.c(u), body).then(ok);
  }
  @Post(":id/add-to-quiz")
  @RequireCapabilities("question_bank.manage", "quiz_questions.manage")
  addToQuiz(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: { quizId?: string },
  ) {
    if (!body.quizId) throw new Error("quizId is required");
    return this.service.copyToQuiz(this.c(u), id, body.quizId).then(ok);
  }
}
