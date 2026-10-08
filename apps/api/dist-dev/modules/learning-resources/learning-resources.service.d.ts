import { Repository } from "typeorm";
import { LearningResource } from "../../database/entities/learning-resource.entity";
import { LearningResourceAssignment } from "../../database/entities/learning-resource-assignment.entity";
import { Student } from "../../database/entities/student.entity";
import { AuthenticatedUser } from "../auth";
import { AuthorizationService } from "../authorization";
import { RealtimeService } from "../realtime/realtime.service";
import { SaveLearningResourceDto } from "./learning-resources.dto";
export declare class LearningResourcesService {
    private resources;
    private assignments;
    private students;
    private authorization;
    private realtime;
    constructor(resources: Repository<LearningResource>, assignments: Repository<LearningResourceAssignment>, students: Repository<Student>, authorization: AuthorizationService, realtime: RealtimeService);
    listManaged(actor: AuthenticatedUser): Promise<LearningResource[]>;
    listAssignableStudents(actor: AuthenticatedUser): Promise<{
        id: string;
        name: string;
        grade: string;
        major: string;
        gradeId: number | null | undefined;
        educationTypeId: string;
        trackId: string;
        learnerProfile: "school" | "independent";
        independentType: "adult" | "gap_year" | "homeschool" | "other" | null | undefined;
        accountStatus: "active" | "archived" | "inactive";
    }[]>;
    listForStudent(actor: AuthenticatedUser, studentId?: string): Promise<LearningResource[]>;
    create(actor: AuthenticatedUser, dto: SaveLearningResourceDto): Promise<LearningResource>;
    update(actor: AuthenticatedUser, id: string, dto: SaveLearningResourceDto): Promise<LearningResource>;
    remove(actor: AuthenticatedUser, id: string): Promise<{
        deleted: boolean;
    }>;
    private find;
    private findEntity;
    private clean;
    private replaceAssignments;
    private emitChange;
    private context;
    private isPlatformAdmin;
    private canAccessEveryStudent;
    private requireStudentScope;
    private requireManageAccess;
}
