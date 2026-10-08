"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCHOOL_CAPABILITIES = void 0;
exports.SCHOOL_CAPABILITIES = {
    students: {
        read: "students.read",
        readAll: "students.read.all",
        readSelf: "students.read.self",
        readAssigned: "students.read.assigned",
        import: "students.import",
        export: "students.export",
    },
    registration: {
        selfRead: "registration.self.read",
        selfUpdate: "registration.self.update",
        manage: "registration.manage",
        review: "registration.review",
    },
    classes: {
        read: "classes.read",
        manage: "classes.manage",
        rosterManage: "classes.roster.manage",
    },
    groups: { read: "class_groups.read", manage: "class_groups.manage" },
    attendance: {
        read: "attendance.read",
        manage: "attendance.manage",
        classRead: "attendance.class.read",
        classManage: "attendance.class.manage",
        groupRead: "attendance.group.read",
        groupManage: "attendance.group.manage",
        dormRead: "attendance.dorm.read",
        dormManage: "attendance.dorm.manage",
        selfRead: "attendance.self.read",
    },
    dormitory: { read: "dormitory.read", manage: "dormitory.manage" },
    relationships: { read: "relationships.read", manage: "relationships.manage" },
};
//# sourceMappingURL=school-capabilities.js.map