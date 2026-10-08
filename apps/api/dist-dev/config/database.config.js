"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
exports.default = () => ({
    database: {
        type: process.env.DATABASE_TYPE || "sqlite",
        path: process.env.DATABASE_PATH || node_path_1.default.resolve(process.cwd(), "data", "moshaver-v2.sqlite"),
        url: process.env.DATABASE_URL || "",
    },
});
//# sourceMappingURL=database.config.js.map