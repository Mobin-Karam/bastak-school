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
exports.SyncMutation = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
let SyncMutation = class SyncMutation {
    id;
    userId;
    mutationId;
    clientMutationId;
    type;
    method;
    path;
    result;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, userId: { required: true, type: () => String }, mutationId: { required: true, type: () => String }, clientMutationId: { required: true, type: () => String }, type: { required: true, type: () => String }, method: { required: true, type: () => String }, path: { required: true, type: () => String }, result: { required: true, type: () => Object }, createdAt: { required: true, type: () => Date } };
    }
};
exports.SyncMutation = SyncMutation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], SyncMutation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SyncMutation.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], SyncMutation.prototype, "mutationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], SyncMutation.prototype, "clientMutationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 48, default: "api_mutation" }),
    __metadata("design:type", String)
], SyncMutation.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], SyncMutation.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 240 }),
    __metadata("design:type", String)
], SyncMutation.prototype, "path", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json" }),
    __metadata("design:type", Object)
], SyncMutation.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SyncMutation.prototype, "createdAt", void 0);
exports.SyncMutation = SyncMutation = __decorate([
    (0, typeorm_1.Entity)("sync_mutations"),
    (0, typeorm_1.Index)(["userId", "mutationId"], { unique: true })
], SyncMutation);
//# sourceMappingURL=sync-mutation.entity.js.map