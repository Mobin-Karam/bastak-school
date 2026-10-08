"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamScoringService = void 0;
const common_1 = require("@nestjs/common");
let ExamScoringService = class ExamScoringService {
    evaluate(exam, answers) {
        const selected = new Map(answers.map((answer) => [answer.questionId, answer.selectedOption || null]));
        const scoring = exam.scoring || { correct: 1, wrong: 0, unanswered: 0, negativeMarking: false };
        const total = this.row();
        const subjects = new Map();
        const topics = new Map();
        for (const question of exam.questions || []) {
            const answer = selected.get(question.id);
            const subject = question.subject || exam.subject || "عمومی";
            const topic = question.topic || "سایر";
            this.add(total, question, answer, scoring);
            const subjectRow = subjects.get(subject) || this.row();
            this.add(subjectRow, question, answer, scoring);
            subjects.set(subject, subjectRow);
            const topicKey = `${subject}\u0000${topic}`;
            const topicRow = topics.get(topicKey) || this.row();
            this.add(topicRow, question, answer, scoring);
            topics.set(topicKey, topicRow);
        }
        return {
            ...total,
            percentage: total.maximum ? total.rawScore / total.maximum * 100 : 0,
            subjects: [...subjects].map(([subject, row]) => ({ subject, ...row, percentage: row.maximum ? row.rawScore / row.maximum * 100 : 0 })),
            topics: [...topics].map(([key, row]) => { const [subject, topic] = key.split("\u0000"); return { subject, topic, ...row, percentage: row.maximum ? row.rawScore / row.maximum * 100 : 0 }; }),
        };
    }
    row() { return { correct: 0, wrong: 0, unanswered: 0, total: 0, rawScore: 0, maximum: 0 }; }
    add(row, question, answer, scoring) {
        const weight = Number.isFinite(question.weight) && question.weight > 0 ? question.weight : 1;
        row.total += 1;
        row.maximum += Math.max(0, scoring.correct) * weight;
        if (!answer) {
            row.unanswered += 1;
            row.rawScore += scoring.unanswered * weight;
        }
        else if (answer === question.correctAnswer) {
            row.correct += 1;
            row.rawScore += scoring.correct * weight;
        }
        else {
            row.wrong += 1;
            row.rawScore += scoring.wrong * weight;
        }
    }
};
exports.ExamScoringService = ExamScoringService;
exports.ExamScoringService = ExamScoringService = __decorate([
    (0, common_1.Injectable)()
], ExamScoringService);
//# sourceMappingURL=exam-scoring.service.js.map