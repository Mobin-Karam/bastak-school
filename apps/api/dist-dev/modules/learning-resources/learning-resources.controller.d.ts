import { AuthenticatedUser } from "../auth";
import { SaveLearningResourceDto } from "./learning-resources.dto";
import { LearningResourcesService } from "./learning-resources.service";
export declare class LearningResourcesController {
    private service;
    constructor(service: LearningResourcesService);
    assigned(user: AuthenticatedUser, studentId?: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").LearningResource[];
    }>;
    assignableStudents(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            name: string;
            grade: string;
            major: string;
            gradeId: number | null | undefined;
            educationTypeId: string;
            trackId: string;
            learnerProfile: "school" | "independent";
            independentType: "adult" | "gap_year" | "homeschool" | "other" | null | undefined;
            accountStatus: "active" | "inactive" | "archived";
        }[];
    }>;
    list(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: import("../../database/entities").LearningResource[];
    }>;
    create(user: AuthenticatedUser, dto: SaveLearningResourceDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").LearningResource;
    }>;
    update(user: AuthenticatedUser, id: string, dto: SaveLearningResourceDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").LearningResource;
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            deleted: boolean;
        };
    }>;
}
