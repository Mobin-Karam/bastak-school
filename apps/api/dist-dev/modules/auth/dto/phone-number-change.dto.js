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
exports.ReviewPhoneNumberChangeRequestDto = exports.CreatePhoneNumberChangeRequestDto = exports.ChangeOwnPhoneNumberDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ChangeOwnPhoneNumberDto {
    phoneNumber;
    static _OPENAPI_METADATA_FACTORY() {
        return { phoneNumber: { required: true, type: () => String, pattern: "^09\\d{9}$" } };
    }
}
exports.ChangeOwnPhoneNumberDto = ChangeOwnPhoneNumberDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^09\d{9}$/),
    __metadata("design:type", String)
], ChangeOwnPhoneNumberDto.prototype, "phoneNumber", void 0);
class CreatePhoneNumberChangeRequestDto extends ChangeOwnPhoneNumberDto {
    organizationId;
    reason;
    static _OPENAPI_METADATA_FACTORY() {
        return { organizationId: { required: true, type: () => String }, reason: { required: false, type: () => String, maxLength: 500 } };
    }
}
exports.CreatePhoneNumberChangeRequestDto = CreatePhoneNumberChangeRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePhoneNumberChangeRequestDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreatePhoneNumberChangeRequestDto.prototype, "reason", void 0);
class ReviewPhoneNumberChangeRequestDto {
    reviewNote;
    static _OPENAPI_METADATA_FACTORY() {
        return { reviewNote: { required: false, type: () => String, maxLength: 500 } };
    }
}
exports.ReviewPhoneNumberChangeRequestDto = ReviewPhoneNumberChangeRequestDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], ReviewPhoneNumberChangeRequestDto.prototype, "reviewNote", void 0);
//# sourceMappingURL=phone-number-change.dto.js.map