"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionBankModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const question_bank_item_entity_1 = require("../../database/entities/question-bank-item.entity");
const exam_entity_1 = require("../../database/entities/exam.entity");
const question_entity_1 = require("../../database/entities/question.entity");
const quiz_entity_1 = require("../../database/entities/quiz.entity");
const quiz_question_entity_1 = require("../../database/entities/quiz-question.entity");
const question_bank_controller_1 = require("./question-bank.controller");
const question_bank_service_1 = require("./question-bank.service");
const authorization_module_1 = require("../authorization/authorization.module");
let QuestionBankModule = class QuestionBankModule {
};
exports.QuestionBankModule = QuestionBankModule;
exports.QuestionBankModule = QuestionBankModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                question_bank_item_entity_1.QuestionBankItem,
                exam_entity_1.Exam,
                question_entity_1.Question,
                quiz_entity_1.Quiz,
                quiz_question_entity_1.QuizQuestion,
            ]),
            authorization_module_1.AuthorizationModule,
        ],
        controllers: [question_bank_controller_1.QuestionBankController],
        providers: [question_bank_service_1.QuestionBankService],
    })
], QuestionBankModule);
//# sourceMappingURL=question-bank.module.js.map