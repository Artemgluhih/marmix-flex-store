import { NextResponse } from "next/server";

import { getSecretSupabaseConfig } from "@/lib/supabase/env";
import { createOrderSecretSupabaseClient } from "@/lib/supabase/secret";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return new NextResponse(null, { status: 404 });
  }

  const raw = process.env.SUPABASE_SECRET_KEY;
  const normalized = raw?.trim();
  const result = {
    previewEnvironment: true,
    envPresent: typeof raw === "string",
    normalizedPresent: Boolean(normalized),
    secretKeyType: normalized?.startsWith("sb_secret_") ?? false,
    normalizedWhitespace: normalized === normalized?.trim(),
    previewProject: false,
    secretServer: false,
    secretStatus: 0,
    directSecretStatus: 0,
    failureKind: "none",
  };

  if (!normalized || !result.secretKeyType) {
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const { url, secretKey } = getSecretSupabaseConfig();
    result.previewProject = new URL(url).hostname === "twuevnwxwqdjbjzwuglm.supabase.co";
    if (!result.previewProject) {
      return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
    }

    const { error, status } = await createOrderSecretSupabaseClient()
      .from("order_requests")
      .select("id")
      .limit(1);
    result.secretServer = !error;
    result.secretStatus = status;

    if (error) {
      // Direct server request isolates the API key check from supabase-js. The
      // modern secret key is sent only as apikey, never as a Bearer JWT.
      const response = await fetch(`${url}/rest/v1/order_requests?select=id&limit=1`, {
        headers: { apikey: secretKey },
        cache: "no-store",
      });
      result.directSecretStatus = response.status;
      if (!response.ok) {
        const body = await response.text();
        result.failureKind = /invalid.api.key/i.test(body) ? "invalid-api-key" : "other";
      }
    }
  } catch {
    result.failureKind = "other";
  }

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
