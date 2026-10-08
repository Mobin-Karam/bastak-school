"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const data_source_1 = __importDefault(require("../data-source"));
const school_seed_1 = require("./school-seed");
async function main() {
    if (process.env.NODE_ENV === "production") {
        throw new Error("Refusing to create development seed identities in production.");
    }
    await (0, school_seed_1.seedSchool)();
}
main().catch((error) => {
    console.error(error);
    if (data_source_1.default.isInitialized)
        void data_source_1.default.destroy();
    process.exitCode = 1;
});
//# sourceMappingURL=seed.js.map