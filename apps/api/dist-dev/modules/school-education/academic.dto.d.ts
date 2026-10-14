export declare class AcademicPageDto {
    offset: number;
    limit: number;
    teacherId?: string;
    classroomId?: string;
    academicYearId?: string;
}
export declare class TeachingAssignmentDto {
    academicYearId: string;
    termId?: string;
    classroomId: string;
    subjectId: string;
    teacherId: string;
    startsOn: string;
    endsOn: string;
}
export declare class SubjectBookReferenceDto {
    subjectId: string;
    bookId: string;
}
export declare class EndTeachingAssignmentDto {
    endsOn: string;
    reason: string;
}
export declare class AcademicSubjectDto {
    code: string;
    name: string;
    category?: string;
}
