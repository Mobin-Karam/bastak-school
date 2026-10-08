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
exports.TopicMastery = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
let TopicMastery = class TopicMastery {
    id;
    studentId;
    topic;
    score;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, studentId: { required: true, type: () => String }, topic: { required: true, type: () => String }, score: { required: true, type: () => Number } };
    }
};
exports.TopicMastery = TopicMastery;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TopicMastery.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TopicMastery.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TopicMastery.prototype, "topic", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], TopicMastery.prototype, "score", void 0);
exports.TopicMastery = TopicMastery = __decorate([
    (0, typeorm_1.Entity)("topic_mastery"),
    (0, typeorm_1.Index)(["studentId", "topic"], { unique: true })
], TopicMastery);
//# sourceMappingURL=topic-mastery.entity.js.map