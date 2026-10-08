"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningItem = exports.LearningStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
const learning_review_entity_1 = require("./learning-review.entity");
var LearningStatus;
(function (LearningStatus) {
    LearningStatus["PENDING"] = "pending";
    LearningStatus["DONE"] = "done";
    LearningStatus["ARCHIVED"] = "archived";
})(LearningStatus || (exports.LearningStatus = LearningStatus = {}));
let LearningItem = class LearningItem {
    id;
    student;
    subject;
    book;
    chapter;
    lesson;
    topic;
    title;
    note;
    hint;
    dueDate;
    intervalDays;
    reviewCount;
    mastery;
    status;
    completedAt;
    createdAt;
    updatedAt;
    reviews;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, student: { required: true, type: () => require("./student.entity").Student }, subject: { required: true, type: () => String }, book: { required: true, type: () => String }, chapter: { required: true, type: () => String }, lesson: { required: true, type: () => String }, topic: { required: true, type: () => String }, title: { required: true, type: () => String }, note: { required: true, type: () => String }, hint: { required: true, type: () => String }, dueDate: { required: true, type: () => String }, intervalDays: { required: true, type: () => Number }, reviewCount: { required: true, type: () => Number }, mastery: { required: true, type: () => Number }, status: { required: true, enum: require("./learning-item.entity").LearningStatus }, completedAt: { required: true, type: () => Date, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date }, reviews: { required: true, type: () => [require("./learning-review.entity").LearningReview] } };
    }
};
exports.LearningItem = LearningItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], LearningItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, (student) => student.learningItems, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], LearningItem.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], LearningItem.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], LearningItem.prototype, "book", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], LearningItem.prototype, "chapter", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], LearningItem.prototype, "lesson", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], LearningItem.prototype, "topic", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 2000 }),
    __metadata("design:type", String)
], LearningItem.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], LearningItem.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], LearningItem.prototype, "hint", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], LearningItem.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], LearningItem.prototype, "intervalDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], LearningItem.prototype, "reviewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "float", default: 0 }),
    __metadata("design:type", Number)
], LearningItem.prototype, "mastery", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 24, default: LearningStatus.PENDING }),
    __metadata("design:type", String)
], LearningItem.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], LearningItem.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LearningItem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LearningItem.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => learning_review_entity_1.LearningReview, (review) => review.item),
    __metadata("design:type", Array)
], LearningItem.prototype, "reviews", void 0);
exports.LearningItem = LearningItem = __decorate([
    (0, typeorm_1.Entity)("learning_items"),
    (0, typeorm_1.Index)(["student", "dueDate"])
], LearningItem);
//# sourceMappingURL=learning-item.entity.js.map