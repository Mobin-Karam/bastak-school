import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QuestionBankItem } from "../../database/entities/question-bank-item.entity";
import { Exam } from "../../database/entities/exam.entity";
import { Question } from "../../database/entities/question.entity";
import { Quiz } from "../../database/entities/quiz.entity";
import { QuizQuestion } from "../../database/entities/quiz-question.entity";
import { QuestionBankController } from "./question-bank.controller";
import { QuestionBankService } from "./question-bank.service";
import { AuthorizationModule } from "../authorization/authorization.module";
@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuestionBankItem,
      Exam,
      Question,
      Quiz,
      QuizQuestion,
    ]),
    AuthorizationModule,
  ],
  controllers: [QuestionBankController],
  providers: [QuestionBankService],
})
export class QuestionBankModule {}
