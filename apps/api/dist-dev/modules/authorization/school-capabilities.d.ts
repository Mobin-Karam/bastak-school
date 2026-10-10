export declare const SCHOOL_CAPABILITIES: {
    readonly students: {
        readonly read: "students.read";
        readonly readAll: "students.read.all";
        readonly readSelf: "students.read.self";
        readonly readAssigned: "students.read.assigned";
        readonly import: "students.import";
        readonly export: "students.export";
    };
    readonly registration: {
        readonly selfRead: "registration.self.read";
        readonly selfUpdate: "registration.self.update";
        readonly manage: "registration.manage";
        readonly review: "registration.review";
    };
    readonly classes: {
        readonly read: "classes.read";
        readonly manage: "classes.manage";
        readonly rosterManage: "classes.roster.manage";
    };
    readonly groups: {
        readonly read: "class_groups.read";
        readonly manage: "class_groups.manage";
    };
    readonly attendance: {
        readonly read: "attendance.read";
        readonly manage: "attendance.manage";
        readonly review: "attendance.review";
        readonly classRead: "attendance.class.read";
        readonly classManage: "attendance.class.manage";
        readonly groupRead: "attendance.group.read";
        readonly groupManage: "attendance.group.manage";
        readonly dormRead: "attendance.dorm.read";
        readonly dormManage: "attendance.dorm.manage";
        readonly selfRead: "attendance.self.read";
    };
    readonly dormitory: {
        readonly read: "dormitory.read";
        readonly manage: "dormitory.manage";
    };
    readonly relationships: {
        readonly read: "relationships.read";
        readonly manage: "relationships.manage";
    };
};
