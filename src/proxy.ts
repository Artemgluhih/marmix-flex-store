import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicSupabaseConfig } from "./lib/supabase/env";

/** Refresh the cookie session only. Authorization is enforced by later admin guards and RLS. */
export async function proxy(request: NextRequest) {
  const { url, publishableKey } = getPublicSupabaseConfig();
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        // Recreate the response with the updated request cookies for Server Components.
        // Preserve previous Set-Cookie values if the SSR client writes more than once.
        const previousResponse = response;
        response = NextResponse.next({ request });
        previousResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
        for (const name of ["Cache-Control", "Expires", "Pragma", "Vary"]) {
          const value = previousResponse.headers.get(name);
          if (value) response.headers.set(name, value);
        }
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });

  // getUser() validates with Auth and refreshes when needed; cookie presence is not identity.
  // A failed session never grants access; the workspace/action guards handle denial.
  try {
    await supabase.auth.getUser();
  } catch {
    // Treat transport/auth exceptions as unauthenticated; never log token details.
  }

  return response;
}

export const config = { matcher: ["/admin/:path*"] };
