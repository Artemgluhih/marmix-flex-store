import { missingPreviewNotificationEnvNames } from "@/lib/orders/notifications";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "t054a-preview-review") {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  // Temporary read-only diagnostic: names only, never values or provider response bodies.
  return Response.json({ missingEnvNames: missingPreviewNotificationEnvNames() },
    { headers: { "Cache-Control": "no-store" } });
}
