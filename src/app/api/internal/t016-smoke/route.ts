import { NextResponse } from "next/server";

import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { createOrderSecretSupabaseClient } from "@/lib/supabase/secret";
import { getSecretSupabaseConfig } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

// Temporary T016 diagnostic; remove immediately after the deployed smoke.
export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return new Response(null, { status: 404 });
  }

  const result = {
    previewProject: false,
    publicCatalog: false,
    publicOrdersDenied: false,
    secretServer: false,
    secretStatus: 0,
    directSecretStatus: 0,
    secretWhitespace: false,
    directFailureKind: "none",
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
      const { error: secretError, status } = await secretClient
        .from("order_requests")
        .select("id")
        .limit(1);
      result.secretServer = secretError === null;
      result.secretStatus = status;

      // Diagnostic only: opaque secret keys belong in apikey, never Bearer JWT.
      const { url, secretKey } = getSecretSupabaseConfig();
      result.secretWhitespace = secretKey !== secretKey.trim();
      const direct = await fetch(`${url}/rest/v1/order_requests?select=id&limit=1`, {
        method: "GET",
        headers: {
          apikey: secretKey,
          "User-Agent": "marmix-flex-preview-server-smoke",
        },
        cache: "no-store",
      });
      result.directSecretStatus = direct.status;
      if (!direct.ok) {
        const diagnostic = (await direct.text()).slice(0, 512).toLowerCase();
        result.directFailureKind = diagnostic.includes("browser")
          ? "browser-policy"
          : diagnostic.includes("invalid api key")
            ? "invalid-api-key"
            : diagnostic.includes("jwt")
              ? "jwt-rejection"
              : "other";
      }
    }
  } catch {
    // Do not return or log configuration values or provider error messages.
  }

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
