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
exports.EducationClassBook = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const education_book_entity_1 = require("./education-book.entity");
const user_entity_1 = require("./user.entity");
let EducationClassBook = class EducationClassBook {
    id;
    classroom;
    book;
    teacher;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, classroom: { required: true, type: () => require("./education-class.entity").EducationClass }, book: { required: true, type: () => require("./education-book.entity").EducationBook }, teacher: { required: true, type: () => require("./user.entity").User }, createdAt: { required: true, type: () => Date } };
    }
};
exports.EducationClassBook = EducationClassBook;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], EducationClassBook.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("EducationClass", (classroom) => classroom.books, {
        nullable: false,
        onDelete: "CASCADE",
    }),
    __metadata("design:type", Function)
], EducationClassBook.prototype, "classroom", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => education_book_entity_1.EducationBook, { nullable: false, onDelete: "RESTRICT" }),
    __metadata("design:type", education_book_entity_1.EducationBook)
], EducationClassBook.prototype, "book", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false, onDelete: "RESTRICT" }),
    __metadata("design:type", user_entity_1.User)
], EducationClassBook.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EducationClassBook.prototype, "createdAt", void 0);
exports.EducationClassBook = EducationClassBook = __decorate([
    (0, typeorm_1.Entity)("education_class_books"),
    (0, typeorm_1.Index)(["classroom", "book"], { unique: true })
], EducationClassBook);
//# sourceMappingURL=education-class-book.entity.js.map