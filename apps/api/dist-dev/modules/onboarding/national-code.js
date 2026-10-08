"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeNationalCode = normalizeNationalCode;
exports.isValidIranianNationalCode = isValidIranianNationalCode;
const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
function normalizeNationalCode(value) {
    return value.trim().replace(/[۰-۹٠-٩]/g, (digit) => {
        const persian = persianDigits.indexOf(digit);
        return String(persian >= 0 ? persian : arabicDigits.indexOf(digit));
    });
}
function isValidIranianNationalCode(value) {
    const code = normalizeNationalCode(value);
    if (!/^\d{10}$/.test(code) || /^(\d)\1{9}$/.test(code))
        return false;
    const sum = code.slice(0, 9).split("").reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);
    const remainder = sum % 11;
    const expected = remainder < 2 ? remainder : 11 - remainder;
    return Number(code[9]) === expected;
}
//# sourceMappingURL=national-code.js.map