import { Observable } from "rxjs";
import { RealtimeService } from "./realtime.service";
import { AuthenticatedUser } from "../auth";
export declare class RealtimeController {
    private readonly realtime;
    constructor(realtime: RealtimeService);
    events(user: AuthenticatedUser | null): Observable<MessageEvent>;
}
