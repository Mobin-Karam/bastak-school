import { Observable } from "rxjs";
import { type RealtimeEvent as CmbRealtimeEvent } from "@moshaver/cmb-realtime";
export type RealtimeEventType = "message" | "notification.created" | "plan.updated" | "exam.created" | "learning-resource.updated" | "system.update" | "chat.message.created" | "attendance.updated" | "attendance.reviewed" | "school-home.updated" | "school.occupancy.updated";
export type RealtimeEvent = CmbRealtimeEvent<RealtimeEventType>;
export declare class RealtimeService {
    private readonly hub;
    stream(userId: string): Observable<RealtimeEvent>;
    emitToUser(userId: string, type: RealtimeEventType, data: unknown): void;
    emitToUsers(userIds: Iterable<string>, type: RealtimeEventType, data: unknown): void;
    connectionCount(userId?: string): number;
}
