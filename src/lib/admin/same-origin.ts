/** Accept only a browser POST from the exact request origin. No wildcard or form-supplied host. */
export function isSameOriginMutationRequest(requestHeaders: Headers): boolean {
  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("host");
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  if (!origin || !host || (forwardedHost && forwardedHost !== host)) return false;

  // Vercel supplies the public protocol. Locally, only explicit localhost HTTP is accepted.
  const localHost = /^(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/.test(host);
  const protocol = forwardedProto ?? (localHost ? "http" : "https");
  if (protocol !== "http" && protocol !== "https") return false;
  if (process.env.VERCEL_ENV && protocol !== "https") return false;
  if (protocol === "http" && !localHost) return false;

  try {
    const actual = new URL(`${protocol}://${host}`);
    const claimed = new URL(origin);
    return (
      actual.host === host &&
      actual.pathname === "/" &&
      actual.username === "" &&
      actual.password === "" &&
      claimed.origin === origin &&
      claimed.origin === actual.origin
    );
  } catch {
    return false;
  }
}
