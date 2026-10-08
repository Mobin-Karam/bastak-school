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
exports.ReviewLearningItemDto = exports.UpdateLearningItemDto = exports.CreateLearningItemDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const learning_item_entity_1 = require("../../../database/entities/learning-item.entity");
class CreateLearningItemDto {
    title;
    subject;
    book;
    chapter;
    lesson;
    topic;
    note;
    hint;
    dueDate;
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String, minLength: 2, maxLength: 2000 }, subject: { required: false, type: () => String, minLength: 0, maxLength: 120 }, book: { required: false, type: () => String, minLength: 0, maxLength: 120 }, chapter: { required: false, type: () => String, minLength: 0, maxLength: 120 }, lesson: { required: false, type: () => String, minLength: 0, maxLength: 120 }, topic: { required: false, type: () => String, minLength: 0, maxLength: 120 }, note: { required: false, type: () => String, minLength: 0, maxLength: 5000 }, hint: { required: false, type: () => String, minLength: 0, maxLength: 5000 }, dueDate: { required: false, type: () => String } };
    }
}
exports.CreateLearningItemDto = CreateLearningItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 2000),
    __metadata("design:type", String)
], CreateLearningItemDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 120),
    __metadata("design:type", String)
], CreateLearningItemDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 120),
    __metadata("design:type", String)
], CreateLearningItemDto.prototype, "book", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 120),
    __metadata("design:type", String)
], CreateLearningItemDto.prototype, "chapter", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 120),
    __metadata("design:type", String)
], CreateLearningItemDto.prototype, "lesson", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 120),
    __metadata("design:type", String)
], CreateLearningItemDto.prototype, "topic", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 5000),
    __metadata("design:type", String)
], CreateLearningItemDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 5000),
    __metadata("design:type", String)
], CreateLearningItemDto.prototype, "hint", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLearningItemDto.prototype, "dueDate", void 0);
class UpdateLearningItemDto extends CreateLearningItemDto {
    status;
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String }, status: { required: false, enum: require("../../../database/entities/learning-item.entity").LearningStatus } };
    }
}
exports.UpdateLearningItemDto = UpdateLearningItemDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateLearningItemDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(learning_item_entity_1.LearningStatus),
    __metadata("design:type", String)
], UpdateLearningItemDto.prototype, "status", void 0);
class ReviewLearningItemDto {
    rating;
    static _OPENAPI_METADATA_FACTORY() {
        return { rating: { required: true, type: () => Number, minimum: 0, maximum: 5 } };
    }
}
exports.ReviewLearningItemDto = ReviewLearningItemDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], ReviewLearningItemDto.prototype, "rating", void 0);
//# sourceMappingURL=learning.dto.js.map