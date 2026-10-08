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
exports.Mistake = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
let Mistake = class Mistake {
    id;
    studentId;
    questionId;
    reason;
    resolved;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, studentId: { required: true, type: () => String }, questionId: { required: true, type: () => String }, reason: { required: true, type: () => String }, resolved: { required: true, type: () => Boolean } };
    }
};
exports.Mistake = Mistake;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Mistake.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Mistake.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Mistake.prototype, "questionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Mistake.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Mistake.prototype, "resolved", void 0);
exports.Mistake = Mistake = __decorate([
    (0, typeorm_1.Entity)("mistakes")
], Mistake);
//# sourceMappingURL=mistake.entity.js.map