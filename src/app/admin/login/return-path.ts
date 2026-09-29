/** A deliberately narrow local path allowlist; never pass user input to redirect unchanged. */
export function adminReturnPath(value: unknown): string {
  if (typeof value !== "string") return "/admin";
  if (value === "/admin") return value;
  if (value === "/admin/login" || value.startsWith("/admin/login/")) return "/admin";
  if (/^\/admin\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(value)) return value;
  return "/admin";
}
