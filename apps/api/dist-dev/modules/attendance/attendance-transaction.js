"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceTransaction = attendanceTransaction;
const writers = new WeakMap();
function attendanceTransaction(manager, work) {
    const previous = writers.get(manager.connection) ?? Promise.resolve();
    const current = previous.then(() => manager.transaction(work));
    writers.set(manager.connection, current.then(() => undefined, () => undefined));
    return current;
}
//# sourceMappingURL=attendance-transaction.js.map