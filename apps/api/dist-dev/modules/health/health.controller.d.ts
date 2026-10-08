import { HealthService } from "./health.service";
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    health(): {
        ok: boolean;
        data: {
            service: string;
            status: "ok";
        };
    };
    ready(): Promise<{
        ok: boolean;
        data: Record<string, "ready">;
    }>;
}
