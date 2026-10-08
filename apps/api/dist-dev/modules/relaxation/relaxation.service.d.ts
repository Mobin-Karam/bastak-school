import { Repository } from "typeorm";
import { RelaxationTrack } from "../../database/entities/relaxation-track.entity";
import { StudentDailyRelaxation } from "../../database/entities/student-daily-relaxation.entity";
import { Student } from "../../database/entities/student.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { AuthenticatedUser } from "../auth";
import { SaveRelaxationTrackDto } from "./relaxation.dto";
export declare class RelaxationService {
    private tracks;
    private selections;
    private students;
    private memberships;
    private audit;
    constructor(tracks: Repository<RelaxationTrack>, selections: Repository<StudentDailyRelaxation>, students: Repository<Student>, memberships: Repository<OrganizationMembership>, audit: Repository<AuditLog>);
    listManaged(): Promise<RelaxationTrack[]>;
    create(actor: AuthenticatedUser, input: SaveRelaxationTrackDto): Promise<RelaxationTrack>;
    update(actor: AuthenticatedUser, id: string, input: SaveRelaxationTrackDto): Promise<RelaxationTrack>;
    audience(id: string): Promise<{
        trackId: string;
        eligibleStudents: number;
        byGrade: {
            grade: number;
            count: number;
        }[];
    }>;
    today(userId: string): Promise<{
        date: string;
        selectedBy: null;
        selected: null;
        tracks: never[];
    } | {
        date: string;
        selectedBy: "STUDENT" | "AUTO";
        selected: RelaxationTrack;
        tracks: RelaxationTrack[];
    }>;
    select(userId: string, trackId: string): Promise<{
        date: string;
        selectedBy: null;
        selected: null;
        tracks: never[];
    } | {
        date: string;
        selectedBy: "STUDENT" | "AUTO";
        selected: RelaxationTrack;
        tracks: RelaxationTrack[];
    }>;
    private student;
    private track;
    private clean;
    private availableFor;
    private organizationIds;
    private record;
    private localDate;
}
