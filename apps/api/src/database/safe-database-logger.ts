import type { Logger } from "typeorm";

/** Never emit SQL, bind values or driver errors: these can contain student PII. */
export class SafeDatabaseLogger implements Logger {
  constructor(private readonly emit: (entry: object) => void = (entry) => console.warn(JSON.stringify(entry))) {}
  logQuery(): void {}
  logQueryError(): void { this.emit({ event: "db.query.error", timestamp: new Date().toISOString() }); }
  logQuerySlow(durationMs: number): void { this.emit({ event: "db.query.slow", timestamp: new Date().toISOString(), durationMs }); }
  logSchemaBuild(): void {}
  logMigration(): void {}
  log(): void {}
}
