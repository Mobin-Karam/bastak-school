export declare class GuardianAccountDto {
    phoneNumber: string;
    password: string;
}
export declare class CreateStudentDto {
    name: string;
    phoneNumber: string;
    password: string;
    organizationId?: string;
    learnerProfile?: "school" | "independent";
    independentType?: "adult" | "gap_year" | "homeschool" | "other";
    learningLevel?: string;
    gradeId?: number;
    educationTypeId?: string;
    trackId?: string;
    grade?: string;
    major?: string;
    targetUniversity?: string;
    targetField?: string;
    targetRank?: string;
    dailyCapacity?: string;
    nationalCode?: string;
    birthDateJalali?: string;
    governmentSchool?: string;
    classId?: string;
    mother?: GuardianAccountDto;
    father?: GuardianAccountDto;
}
export declare class UpdateStudentDto {
    learnerProfile?: "school" | "independent";
    independentType?: "adult" | "gap_year" | "homeschool" | "other";
    learningLevel?: string;
    name?: string;
    phoneNumber?: string;
    gradeId?: number;
    educationTypeId?: string;
    trackId?: string;
    grade?: string;
    major?: string;
    targetUniversity?: string;
    targetField?: string;
    targetRank?: string;
    dailyCapacity?: string;
    nationalCode?: string;
    birthDateJalali?: string;
    governmentSchool?: string;
    classId?: string;
    clearClass?: boolean;
    mother?: GuardianAccountDto;
    father?: GuardianAccountDto;
}
export declare class ResetStudentPasswordDto {
    password: string;
}
