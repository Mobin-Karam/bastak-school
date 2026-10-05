/** Deterministic, non-real mobile number for local/demo identities. */
export function seedPhoneNumber(identity: string) {
  let hash = 0;
  for (const character of identity) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return `091${String(hash % 100_000_000).padStart(8, "0")}`;
}
