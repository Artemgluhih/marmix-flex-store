import { MAX_ORDER_BODY_BYTES, validateOrderRequest } from "@/lib/orders/validate-request";

const RESPONSE_HEADERS = { "Cache-Control": "no-store", "Vary": "Origin" };

function reply(status: number, code: string, message: string, fields?: string[]) {
  return Response.json({ code, message, ...(fields?.length ? { fields } : {}) },
    { status, headers: RESPONSE_HEADERS });
}

function allowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    if (parsed.origin !== origin || parsed.username || parsed.password) return false;
    const deployed = process.env.VERCEL_URL;
    const canonical = process.env.SITE_URL;
    const allowed = new Set<string>();
    if (deployed) allowed.add(new URL(`https://${deployed}`).origin);
    // A Preview must not accept the Production canonical origin.
    if (canonical && process.env.VERCEL_ENV === "production") allowed.add(new URL(canonical).origin);
    if (process.env.NODE_ENV === "development") allowed.add(new URL(request.url).origin);
    return allowed.has(origin);
  } catch {
    return false;
  }
}

async function limitedJson(request: Request): Promise<{ value: unknown } | { error: "large" | "invalid" }> {
  const declared = request.headers.get("content-length");
  if (declared && /^\d+$/.test(declared) && Number(declared) > MAX_ORDER_BODY_BYTES) return { error: "large" };
  if (!request.body) return { error: "invalid" };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_ORDER_BODY_BYTES) {
        await reader.cancel();
        return { error: "large" };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
  } catch {
    return { error: "invalid" };
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!allowedOrigin(request)) return reply(403, "FORBIDDEN_ORIGIN", "Недопустимый источник запроса.");
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get("content-type") ?? "")) {
    return reply(415, "UNSUPPORTED_MEDIA_TYPE", "Ожидается JSON.");
  }
  const body = await limitedJson(request);
  if ("error" in body) return body.error === "large"
    ? reply(413, "REQUEST_TOO_LARGE", "Запрос слишком большой.")
    : reply(400, "INVALID_REQUEST", "Некорректный JSON.");
  const parsed = validateOrderRequest(body.value);
  if (!parsed.ok) return reply(400, "INVALID_FIELDS", "Проверьте данные запроса.", parsed.fields);
  // Validation only: the displayed price and contact data are never persisted or echoed.
  return Response.json({ validated: true, submitted: false }, { status: 200, headers: RESPONSE_HEADERS });
}
