"use strict";

// Jest's VM runs Fastify's cookie plugin through dynamic import while
// light-my-request loads the same package with require. cookie@2 is ESM-only,
// so production uses it directly and this test-only adapter provides the two
// APIs Fastify consumes in either module-loading path.
function parseCookie(header) {
  const result = Object.create(null);
  if (typeof header !== "string" || !header) return result;

  for (const segment of header.split(";")) {
    const separator = segment.indexOf("=");
    if (separator < 0) continue;
    const name = segment.slice(0, separator).trim();
    if (!name || Object.prototype.hasOwnProperty.call(result, name)) continue;
    const rawValue = segment.slice(separator + 1).trim();
    try {
      result[name] = decodeURIComponent(rawValue);
    } catch {
      result[name] = rawValue;
    }
  }
  return result;
}

function stringifySetCookie(cookie, options) {
  const source = cookie || {};
  const encode =
    options && typeof options.encode === "function"
      ? options.encode
      : encodeURIComponent;
  const attributes = [`${source.name}=${encode(String(source.value ?? ""))}`];
  if (source.maxAge != null)
    attributes.push(`Max-Age=${Math.floor(source.maxAge)}`);
  if (source.domain) attributes.push(`Domain=${source.domain}`);
  if (source.path) attributes.push(`Path=${source.path}`);
  if (source.expires)
    attributes.push(`Expires=${new Date(source.expires).toUTCString()}`);
  if (source.httpOnly) attributes.push("HttpOnly");
  if (source.secure) attributes.push("Secure");
  if (source.partitioned) attributes.push("Partitioned");
  if (source.priority) attributes.push(`Priority=${source.priority}`);
  if (source.sameSite) {
    attributes.push(
      `SameSite=${source.sameSite === true ? "Strict" : source.sameSite}`,
    );
  }
  return attributes.join("; ");
}

module.exports = { parseCookie, stringifySetCookie };
