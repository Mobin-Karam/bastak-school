const SAFE_PROXY_RANGES = ["loopback", "linklocal", "uniquelocal"];

/**
 * Fastify only trusts forwarding headers from a local/private reverse proxy.
 * Production may provide a narrower comma-separated CIDR/IP list when its
 * network topology requires it; `TRUST_PROXY=1` remains backwards compatible
 * without trusting arbitrary public peers.
 */
export function resolveTrustedProxy(
  enabled: string | undefined,
  configuredRanges: string | undefined,
): false | string[] {
  if (enabled !== "1") return false;
  const ranges = (configuredRanges || SAFE_PROXY_RANGES.join(","))
    .split(",")
    .map((range) => range.trim())
    .filter(Boolean);
  return ranges.length > 0 ? ranges : SAFE_PROXY_RANGES;
}
