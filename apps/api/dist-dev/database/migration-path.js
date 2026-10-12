"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseMigrationGlob = databaseMigrationGlob;
const node_path_1 = __importDefault(require("node:path"));
function databaseMigrationGlob(runtimeFile) {
    return node_path_1.default.join(node_path_1.default.dirname(runtimeFile), "migrations", runtimeFile.endsWith(".ts") ? "*.ts" : "*.js");
}
//# sourceMappingURL=migration-path.js.map