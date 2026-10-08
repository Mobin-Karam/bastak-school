import { CmbRuntimeService } from "../../platform/cmb-runtime.service";
export declare class HealthService {
    private readonly core;
    constructor(runtime: CmbRuntimeService);
    health(): {
        service: string;
        status: "ok";
    };
    ready(): Promise<Record<string, "ready">>;
}
