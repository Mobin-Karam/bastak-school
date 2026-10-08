"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeIranianMobile = normalizeIranianMobile;
exports.isIranianMobile = isIranianMobile;
function normalizeIranianMobile(value) {
    const digits = value.trim().replace(/[\s()-]/g, "").replace(/^\+98/, "0").replace(/^0098/, "0").replace(/^98(?=9)/, "0");
    return digits.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}
function isIranianMobile(value) {
    return /^09\d{9}$/.test(normalizeIranianMobile(value));
}
//# sourceMappingURL=phone-number.js.map