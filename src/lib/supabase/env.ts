import "server-only";

function requireEnv(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(`Missing required Supabase configuration: ${name}`);
  }

  return value;
}

export function getPublicSupabaseConfig() {
  const url = requireEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const publishableKey = requireEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  // A mistaken secret in NEXT_PUBLIC_* would otherwise enter the browser bundle.
  if (!publishableKey.startsWith("sb_publishable_")) {
    throw new Error("Invalid Supabase publishable key configuration");
  }

  try {
    if (new URL(url).protocol !== "https:") {
      throw new Error("Invalid Supabase URL");
    }
  } catch {
    throw new Error("Invalid Supabase URL configuration");
  }

  return { url, publishableKey };
}

export function getSecretSupabaseConfig() {
  const { url } = getPublicSupabaseConfig();
  const secretKey = requireEnv("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY);

  // Fail closed when a publishable or legacy JWT key is configured by mistake.
  if (!secretKey.startsWith("sb_secret_")) {
    throw new Error("Invalid Supabase secret key configuration");
  }

  return { url, secretKey };
}
