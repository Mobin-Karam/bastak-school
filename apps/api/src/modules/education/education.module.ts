import { Module } from "@nestjs/common";
import { AssessmentsModule } from "../assessments/assessments.module";
import { EducationCatalogModule } from "../education-catalog/education-catalog.module";
import { ExamsModule } from "../exams/exams.module";
import { LearningResourcesModule } from "../learning-resources/learning-resources.module";
import { PlanTemplatesModule } from "../plan-templates/plan-templates.module";
import { PlansModule } from "../plans/plans.module";
import { QuestionsModule } from "../questions/questions.module";
import { QuizModule } from "../quiz/quiz.module";
import { SubjectsModule } from "../subjects/subjects.module";
import { ClassesModule } from "../classes/classes.module";
import { QuestionBankModule } from "../question-bank/question-bank.module";

/**
 * Product composition boundary for the Admin education workspace.
 * Domain modules stay independently testable; application wiring has one owner.
 */
@Module({
  imports: [
    EducationCatalogModule,
    PlansModule,
    PlanTemplatesModule,
    LearningResourcesModule,
    ExamsModule,
    AssessmentsModule,
    QuestionsModule,
    QuizModule,
    SubjectsModule,
    ClassesModule,
    QuestionBankModule,
  ],
})
export class EducationModule {}
