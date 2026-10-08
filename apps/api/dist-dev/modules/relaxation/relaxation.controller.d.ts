import { AuthenticatedUser } from "../auth";
import { SaveRelaxationTrackDto, SelectRelaxationTrackDto } from "./relaxation.dto";
import { RelaxationService } from "./relaxation.service";
export declare class RelaxationAdminController {
    private service;
    constructor(service: RelaxationService);
    list(): Promise<{
        ok: boolean;
        data: import("../../database/entities").RelaxationTrack[];
    }>;
    audience(id: string): Promise<{
        ok: boolean;
        data: {
            trackId: string;
            eligibleStudents: number;
            byGrade: {
                grade: number;
                count: number;
            }[];
        };
    }>;
    create(user: AuthenticatedUser, dto: SaveRelaxationTrackDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").RelaxationTrack;
    }>;
    update(user: AuthenticatedUser, id: string, dto: SaveRelaxationTrackDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").RelaxationTrack;
    }>;
}
export declare class RelaxationStudentController {
    private service;
    constructor(service: RelaxationService);
    today(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            date: string;
            selectedBy: null;
            selected: null;
            tracks: never[];
        } | {
            date: string;
            selectedBy: "STUDENT" | "AUTO";
            selected: import("../../database/entities").RelaxationTrack;
            tracks: import("../../database/entities").RelaxationTrack[];
        };
    }>;
    select(user: AuthenticatedUser, dto: SelectRelaxationTrackDto): Promise<{
        ok: boolean;
        data: {
            date: string;
            selectedBy: null;
            selected: null;
            tracks: never[];
        } | {
            date: string;
            selectedBy: "STUDENT" | "AUTO";
            selected: import("../../database/entities").RelaxationTrack;
            tracks: import("../../database/entities").RelaxationTrack[];
        };
    }>;
}
