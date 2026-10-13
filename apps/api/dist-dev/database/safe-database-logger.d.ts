import type { Logger } from "typeorm";
export declare class SafeDatabaseLogger implements Logger {
    private readonly emit;
    constructor(emit?: (entry: object) => void);
    logQuery(): void;
    logQueryError(): void;
    logQuerySlow(durationMs: number): void;
    logSchemaBuild(): void;
    logMigration(): void;
    log(): void;
}
