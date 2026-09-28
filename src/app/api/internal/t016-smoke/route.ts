import { NextResponse } from "next/server";

import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { createOrderSecretSupabaseClient } from "@/lib/supabase/secret";

export const dynamic = "force-dynamic";

// Temporary T016 Preview-only verification route; remove after recording evidence.
export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return new Response(null, { status: 404 });
  }

  const result = {
    previewEnvironment: true,
    previewProject: false,
    publicCatalog: false,
    publicOrdersDenied: false,
    secretEnvPresent: Boolean(process.env.SUPABASE_SECRET_KEY),
    secretKeyFormat: process.env.SUPABASE_SECRET_KEY?.startsWith("sb_secret_") ?? false,
    secretServer: false,
    secretHttpStatus: 0,
    secretErrorCode: "",
  };

  try {
    result.previewProject =
      new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname ===
      "twuevnwxwqdjbjzwuglm.supabase.co";

    if (result.previewProject) {
      const publicClient = createPublicSupabaseClient();
      const { error: catalogError } = await publicClient
        .from("categories")
        .select("id")
        .limit(1);
      result.publicCatalog = catalogError === null;

      const { error: orderError } = await publicClient
        .from("order_requests")
        .select("id")
        .limit(1);
      result.publicOrdersDenied = orderError !== null;

      const secretClient = createOrderSecretSupabaseClient();
      const { error: secretError, status: secretStatus } = await secretClient
        .from("order_requests")
        .select("id")
        .limit(1);
      result.secretServer = secretError === null;
      result.secretHttpStatus = secretStatus;
      result.secretErrorCode = /^[A-Z0-9_]{1,24}$/.test(secretError?.code ?? "")
        ? (secretError?.code ?? "")
        : "";
    }
  } catch {
    // Configuration and network errors remain private; only booleans leave the server.
  }

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
