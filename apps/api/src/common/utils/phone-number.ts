/** Canonical Iranian mobile number used as the account login identifier. */
export function normalizeIranianMobile(value: string) {
  const digits = value.trim().replace(/[\s()-]/g, "").replace(/^\+98/, "0").replace(/^0098/, "0").replace(/^98(?=9)/, "0");
  return digits.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

export function isIranianMobile(value: string) {
  return /^09\d{9}$/.test(normalizeIranianMobile(value));
}
