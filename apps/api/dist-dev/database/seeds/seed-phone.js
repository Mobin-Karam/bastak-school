"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPhoneNumber = seedPhoneNumber;
function seedPhoneNumber(identity) {
    let hash = 0;
    for (const character of identity)
        hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    return `091${String(hash % 100_000_000).padStart(8, "0")}`;
}
//# sourceMappingURL=seed-phone.js.map