"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeDatabaseLogger = void 0;
class SafeDatabaseLogger {
    emit;
    constructor(emit = (entry) => console.warn(JSON.stringify(entry))) {
        this.emit = emit;
    }
    logQuery() { }
    logQueryError() { this.emit({ event: "db.query.error", timestamp: new Date().toISOString() }); }
    logQuerySlow(durationMs) { this.emit({ event: "db.query.slow", timestamp: new Date().toISOString(), durationMs }); }
    logSchemaBuild() { }
    logMigration() { }
    log() { }
}
exports.SafeDatabaseLogger = SafeDatabaseLogger;
//# sourceMappingURL=safe-database-logger.js.map