export declare class TeachingAssignment {
    id: string;
    organizationId: string;
    organization?: object;
    academicYearId: string;
    year?: object;
    termId: string | null;
    term?: object;
    classroomId: string;
    classroom?: object;
    subjectId: string;
    subject?: object;
    teacherId: string;
    teacher?: object;
    startsOn: string;
    endsOn: string;
    status: "ACTIVE" | "ENDED";
    createdById: string;
    createdBy?: object;
    createdAt: Date;
}
export declare class SubjectBookReference {
    id: string;
    organizationId: string;
    organization?: object;
    subjectId: string;
    subject?: object;
    bookId: string;
    book?: object;
    createdAt: Date;
}
export declare class ClassEnrollmentHistory {
    id: string;
    organizationId: string;
    organization?: object;
    classroomId: string;
    classroom?: object;
    actorId: string;
    actor?: object;
    beforeStudentIds: string[];
    afterStudentIds: string[];
    createdAt: Date;
}
