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
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ok } from "../../common/utils/envelope";
import { UserRole } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";
import { StudentsService } from "./students.service";
import {
  CreateLearningItemDto,
  ReviewLearningItemDto,
  UpdateLearningItemDto,
} from "./dto/learning.dto";
import { UpdateOwnStudentProfileDto } from "./dto/update-own-student-profile.dto";

@Controller("student")
@Roles(UserRole.STUDENT)
export class StudentController {
  constructor(private readonly students: StudentsService) {}

  @Get("dashboard")
  @RequireCapabilities("plans.read")
  dashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.students.dashboard(user?.id).then(ok);
  }

  @Get("today")
  @RequireCapabilities("plans.read")
  today(@CurrentUser() user: AuthenticatedUser) {
    return this.students.today(user?.id).then(ok);
  }

  @Get("plans")
  @RequireCapabilities("plans.read")
  plans(@CurrentUser() user: AuthenticatedUser, @Query("date") date?: string) {
    return this.students
      .day(user?.id, date)
      .then((data) => ok(data.plan ? [data.plan] : []));
  }

  @Get("progress")
  @RequireCapabilities("learning.read")
  progress(@CurrentUser() user: AuthenticatedUser) {
    return this.students.progress(user?.id).then(ok);
  }

  @Get("progress/weekly")
  @RequireCapabilities("learning.read")
  weeklyProgress(@CurrentUser() user: AuthenticatedUser) {
    return this.students.progress(user?.id).then(ok);
  }

  @Get("reviews")
  @RequireCapabilities("learning.read")
  reviews(@CurrentUser() user: AuthenticatedUser) {
    return this.students.reviews(user?.id).then(ok);
  }

  @Get("learning/summary")
  @RequireCapabilities("learning.read")
  learningSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.students.learning(user?.id).then((data) => ok(data.summary));
  }

  @Get("learning/items")
  @RequireCapabilities("learning.read")
  learningItems(@CurrentUser() user: AuthenticatedUser) {
    return this.students.learning(user?.id).then((data) => ok(data.items));
  }

  @Get("chat-privacy")
  chatPrivacy(@CurrentUser() user: AuthenticatedUser) {
    return this.students.chatPrivacy(user.id).then(ok);
  }

  @Patch("chat-privacy")
  updateChatPrivacy(
    @CurrentUser() user: AuthenticatedUser,
    @Body("guardianReadOnly") enabled: unknown,
  ) {
    return this.students.updateChatPrivacy(user.id, enabled).then(ok);
  }

  @Patch("profile")
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOwnStudentProfileDto,
  ) {
    return this.students.updateOwnProfile(user.id, dto).then(ok);
  }
}

@Controller()
@Roles(UserRole.STUDENT)
export class StudentParityController {
  constructor(private readonly students: StudentsService) {}

  @Get("reviews")
  @RequireCapabilities("learning.read")
  reviews(@CurrentUser() user: AuthenticatedUser) {
    return this.students.reviews(user?.id).then(ok);
  }

  @Get("progress/weekly")
  @RequireCapabilities("learning.read")
  weeklyProgress(@CurrentUser() user: AuthenticatedUser) {
    return this.students.progress(user?.id).then(ok);
  }

  @Get("learning/summary")
  @RequireCapabilities("learning.read")
  learningSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.students.learning(user?.id).then((data) => ok(data.summary));
  }

  @Get("learning/items")
  @RequireCapabilities("learning.read")
  learningItems(@CurrentUser() user: AuthenticatedUser) {
    return this.students.learning(user?.id).then((data) => ok(data.items));
  }

  @Post("learning/items")
  @RequireCapabilities("learning.create")
  async createLearning(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLearningItemDto,
  ) {
    return ok(
      await this.students.createLearningItem(
        await this.students.studentIdForUser(user.id),
        dto,
      ),
    );
  }

  @Patch("learning/items/:id")
  @RequireCapabilities("learning.update")
  async updateLearning(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateLearningItemDto,
  ) {
    return ok(
      await this.students.updateLearningItem(
        await this.students.studentIdForUser(user.id),
        id,
        dto,
      ),
    );
  }

  @Delete("learning/items/:id")
  @RequireCapabilities("learning.update")
  async deleteLearning(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return ok(
      await this.students.deleteLearningItem(
        await this.students.studentIdForUser(user.id),
        id,
      ),
    );
  }

  @Post("learning/items/:id/review")
  @RequireCapabilities("learning.review")
  async reviewLearning(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: ReviewLearningItemDto,
  ) {
    return ok(
      await this.students.reviewLearningItem(
        await this.students.studentIdForUser(user.id),
        id,
        dto.rating,
      ),
    );
  }

  @Get("learning/items/:id/reviews")
  @RequireCapabilities("learning.read")
  async learningHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return ok(
      await this.students.learningReviewHistory(
        await this.students.studentIdForUser(user.id),
        id,
      ),
    );
  }
}

@Controller("students")
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get("me")
  @Roles(UserRole.STUDENT)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.students.find(user.id).then(ok);
  }

  @Get("me/profile")
  @Roles(UserRole.STUDENT)
  meProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.students.find(user.id).then((student) =>
      ok({
        ...student,
        identity: {
          firstName: student?.user?.firstName ?? "",
          lastName: student?.user?.lastName ?? "",
          fullName: student?.name ?? "",
          nationalCode: student?.nationalCode ?? null,
          phoneNumber: student?.user?.phoneNumber ?? null,
          email: student?.user?.email ?? null,
          profilePhoto: student?.user?.chatAvatarUrl ?? "",
        },
        education: {
          learnerProfile: student?.learnerProfile ?? "school",
          independentType: student?.independentType ?? null,
          learningLevel: student?.learningLevel ?? "",
          gradeId: student?.gradeId ?? null,
          educationTypeId: student?.educationTypeId ?? "",
          trackId: student?.trackId ?? "",
          grade: student?.grade ?? "",
          major: student?.major ?? "",
          targetUniversity: student?.targetUniversity ?? "",
          targetField: student?.targetField ?? "",
          targetRank: student?.targetRank ?? "",
          dailyCapacity: student?.dailyCapacity ?? "",
        },
        attendanceSummary: {
          totalSessions: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        },
      }),
    );
  }
}
