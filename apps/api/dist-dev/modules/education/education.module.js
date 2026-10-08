"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EducationModule = void 0;
const common_1 = require("@nestjs/common");
const assessments_module_1 = require("../assessments/assessments.module");
const education_catalog_module_1 = require("../education-catalog/education-catalog.module");
const exams_module_1 = require("../exams/exams.module");
const learning_resources_module_1 = require("../learning-resources/learning-resources.module");
const plan_templates_module_1 = require("../plan-templates/plan-templates.module");
const plans_module_1 = require("../plans/plans.module");
const questions_module_1 = require("../questions/questions.module");
const quiz_module_1 = require("../quiz/quiz.module");
const subjects_module_1 = require("../subjects/subjects.module");
const classes_module_1 = require("../classes/classes.module");
const question_bank_module_1 = require("../question-bank/question-bank.module");
let EducationModule = class EducationModule {
};
exports.EducationModule = EducationModule;
exports.EducationModule = EducationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            education_catalog_module_1.EducationCatalogModule,
            plans_module_1.PlansModule,
            plan_templates_module_1.PlanTemplatesModule,
            learning_resources_module_1.LearningResourcesModule,
            exams_module_1.ExamsModule,
            assessments_module_1.AssessmentsModule,
            questions_module_1.QuestionsModule,
            quiz_module_1.QuizModule,
            subjects_module_1.SubjectsModule,
            classes_module_1.ClassesModule,
            question_bank_module_1.QuestionBankModule,
        ],
    })
], EducationModule);
//# sourceMappingURL=education.module.js.map