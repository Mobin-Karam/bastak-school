"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSafeDemoDatabase = requireSafeDemoDatabase;
exports.requireSafePlatformDatabase = requireSafePlatformDatabase;
const node_path_1 = __importDefault(require("node:path"));
const node_os_1 = __importDefault(require("node:os"));
function requireSafeDemoDatabase(action) {
    const allow = action === "seed"
        ? process.env.ALLOW_DEMO_SEED
        : process.env.ALLOW_DEMO_RESET;
    if (process.env.NODE_ENV === "production" || allow !== "true") {
        throw new Error(`Refusing demo ${action}: use NODE_ENV=development and ALLOW_DEMO_${action === "seed" ? "SEED" : "RESET"}=true.`);
    }
    const database = node_path_1.default.resolve(process.env.DATABASE_PATH || "");
    const safeName = /(?:demo|test|e2e)/i.test(node_path_1.default.basename(database));
    const inTemp = database.startsWith(`${node_path_1.default.resolve(node_os_1.default.tmpdir())}${node_path_1.default.sep}`);
    if (!database || (!safeName && !inTemp)) {
        throw new Error(`Refusing demo ${action}: DATABASE_PATH must name a demo/test/e2e database or live under the system temporary directory.`);
    }
    return database;
}
function requireSafePlatformDatabase(action) {
    const allow = action === "seed"
        ? process.env.ALLOW_PLATFORM_SEED
        : process.env.ALLOW_PLATFORM_RESET;
    if (process.env.NODE_ENV === "production" || allow !== "true")
        throw new Error(`Refusing platform ${action}: explicit development opt-in is required.`);
    const database = node_path_1.default.resolve(process.env.DATABASE_PATH ||
        node_path_1.default.resolve(process.cwd(), "data", "moshaver-v2.sqlite"));
    const expected = node_path_1.default.resolve(process.cwd(), "data", "moshaver-v2.sqlite");
    const inTemp = database.startsWith(`${node_path_1.default.resolve(node_os_1.default.tmpdir())}${node_path_1.default.sep}`);
    if (database !== expected && !inTemp)
        throw new Error("Refusing platform reset outside the API development database or system temporary directory.");
    return database;
}
//# sourceMappingURL=demo-guard.js.map