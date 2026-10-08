"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSourceOptions = void 0;
require("reflect-metadata");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const typeorm_1 = require("typeorm");
const entities = __importStar(require("./entities"));
const databasePath = process.env.DATABASE_PATH || node_path_1.default.resolve(process.cwd(), "data", "moshaver-v2.sqlite");
const dir = node_path_1.default.dirname(databasePath);
if (!node_fs_1.default.existsSync(dir))
    node_fs_1.default.mkdirSync(dir, { recursive: true });
const entityClasses = Object.values(entities).filter((value) => typeof value === "function");
exports.dataSourceOptions = {
    type: "better-sqlite3",
    database: databasePath,
    entities: entityClasses,
    migrations: ["dist/database/migrations/*.js"],
    synchronize: false,
    migrationsRun: true,
    prepareDatabase: (db) => {
        db.pragma("foreign_keys = ON");
        db.pragma("journal_mode = WAL");
        db.pragma(`busy_timeout = ${Number(process.env.SQLITE_BUSY_TIMEOUT_MS || 5000)}`);
    },
};
exports.default = new typeorm_1.DataSource(exports.dataSourceOptions);
//# sourceMappingURL=data-source.js.map