"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolEducationModule = void 0;
const common_1 = require("@nestjs/common");
const classes_module_1 = require("../classes/classes.module");
const class_groups_module_1 = require("../class-groups/class-groups.module");
const education_catalog_module_1 = require("../education-catalog/education-catalog.module");
let SchoolEducationModule = class SchoolEducationModule {
};
exports.SchoolEducationModule = SchoolEducationModule;
exports.SchoolEducationModule = SchoolEducationModule = __decorate([
    (0, common_1.Module)({
        imports: [education_catalog_module_1.EducationCatalogModule, classes_module_1.ClassesModule, class_groups_module_1.ClassGroupsModule],
        exports: [education_catalog_module_1.EducationCatalogModule, classes_module_1.ClassesModule, class_groups_module_1.ClassGroupsModule],
    })
], SchoolEducationModule);
//# sourceMappingURL=school-education.module.js.map