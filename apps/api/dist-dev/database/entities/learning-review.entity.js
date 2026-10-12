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
exports.LearningReview = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const learning_item_entity_1 = require("./learning-item.entity");
let LearningReview = class LearningReview {
    id;
    item;
    rating;
    previousMastery;
    newMastery;
    previousIntervalDays;
    nextIntervalDays;
    nextReviewAt;
    reviewedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, item: { required: true, type: () => require("./learning-item.entity").LearningItem }, rating: { required: true, type: () => Number }, previousMastery: { required: true, type: () => Number }, newMastery: { required: true, type: () => Number }, previousIntervalDays: { required: true, type: () => Number }, nextIntervalDays: { required: true, type: () => Number }, nextReviewAt: { required: true, type: () => String }, reviewedAt: { required: true, type: () => Date } };
    }
};
exports.LearningReview = LearningReview;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], LearningReview.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => learning_item_entity_1.LearningItem, (item) => item.reviews, { onDelete: "CASCADE" }),
    __metadata("design:type", learning_item_entity_1.LearningItem)
], LearningReview.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "float", default: 0 }),
    __metadata("design:type", Number)
], LearningReview.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "float", default: 0 }),
    __metadata("design:type", Number)
], LearningReview.prototype, "previousMastery", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "float", default: 0 }),
    __metadata("design:type", Number)
], LearningReview.prototype, "newMastery", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], LearningReview.prototype, "previousIntervalDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], LearningReview.prototype, "nextIntervalDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], LearningReview.prototype, "nextReviewAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LearningReview.prototype, "reviewedAt", void 0);
exports.LearningReview = LearningReview = __decorate([
    (0, typeorm_1.Entity)("learning_reviews")
], LearningReview);
//# sourceMappingURL=learning-review.entity.js.map