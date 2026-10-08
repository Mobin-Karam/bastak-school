"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_fs_1 = __importDefault(require("node:fs"));
const demo_guard_1 = require("./demo-guard");
async function resetPlatform() {
    const database = (0, demo_guard_1.requireSafePlatformDatabase)("reset");
    const removed = [];
    for (const candidate of [database, `${database}-wal`, `${database}-shm`]) {
        if (node_fs_1.default.existsSync(candidate)) {
            node_fs_1.default.unlinkSync(candidate);
            removed.push(candidate);
        }
    }
    console.log(JSON.stringify({ database, removed }, null, 2));
}
resetPlatform().catch((error) => { console.error(error); process.exitCode = 1; });
//# sourceMappingURL=reset-platform.js.map