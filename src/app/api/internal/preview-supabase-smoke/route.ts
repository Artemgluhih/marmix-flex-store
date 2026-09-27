export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const previewSupabaseOrigin = "https://twuevnwxwqdjbjzwuglm.supabase.co";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return new Response(null, { status: 404 });
  }

  // Read from the server process so the smoke checks deployed runtime env.
  const serverEnvironment = process.env;
  const url = serverEnvironment.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = serverEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const envPresent = Boolean(url && publishableKey);
  let supabaseReachable = false;

  if (url && publishableKey) {
    try {
      if (
        new URL(url).origin === previewSupabaseOrigin &&
        publishableKey.startsWith("sb_publishable_")
      ) {
        const response = await fetch(`${previewSupabaseOrigin}/auth/v1/health`, {
          headers: {
            apikey: publishableKey,
            Accept: "application/json",
          },
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(5000),
        });
        supabaseReachable = response.ok;
      }
    } catch {
      // No environment values or upstream error details belong in responses or logs.
    }
  }

  return Response.json(
    { previewEnvironment: true, envPresent, supabaseReachable },
    { headers: { "Cache-Control": "no-store" } },
  );
}
