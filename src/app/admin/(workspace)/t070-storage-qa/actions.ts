"use server";

import { redirect, notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import { requireAdminMutation } from "@/lib/admin/require-admin";
import { getPublicSupabaseConfig } from "@/lib/supabase/env";
import { T070_BUCKET, T070_INVALID_PATH, T070_PATH, t070StorageQaEnabled } from "./gate";

// A 2 × 2 solid graphite WebP. Public, synthetic, and unrelated to a product.
const WEBP = Buffer.from("UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoCAAIAAkA4JaQAA3AA/vmQwAA=", "base64");

function result(code: string): never {
  redirect(`/admin/t070-storage-qa?result=${encodeURIComponent(code)}`);
}

async function adminBucket() {
  if (!t070StorageQaEnabled()) notFound();
  // The existing guard verifies both exact Origin and the live user membership.
  const { supabase } = await requireAdminMutation();
  return supabase.storage.from(T070_BUCKET);
}

function anonymousBucket() {
  // No cookie adapter and no bearer token: a separate anonymous client.
  const { url, publishableKey } = getPublicSupabaseConfig();
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }).storage.from(T070_BUCKET);
}

async function exists(bucket: Awaited<ReturnType<typeof adminBucket>>, path: string) {
  const { data, error } = await bucket.info(path);
  if (data && !error) return "present";
  if (error?.statusCode === "404") return "absent";
  return "unknown";
}

export async function t070Preflight() {
  const bucket = await adminBucket();
  const exact = await exists(bucket, T070_PATH);
  const invalid = await exists(bucket, T070_INVALID_PATH);
  result(exact === "absent" && invalid === "absent" ? "preflight_clear" : "preflight_stop");
}

export async function t070AnonymousUpload() {
  const bucket = await adminBucket();
  if (await exists(bucket, T070_PATH) !== "absent") result("fixture_not_absent");
  const attempt = await anonymousBucket().upload(T070_PATH, WEBP, { contentType: "image/webp", upsert: false });
  const after = await exists(bucket, T070_PATH);
  if (after === "present") result("anon_upload_allowed_stop");
  if (after !== "absent") result("state_unknown_stop");
  result(attempt.error ? "anon_upload_denied" : "anon_upload_ambiguous_stop");
}

export async function t070AuthenticatedUpload() {
  const bucket = await adminBucket();
  if (await exists(bucket, T070_PATH) !== "absent") result("fixture_not_absent");
  const upload = await bucket.upload(T070_PATH, WEBP, { contentType: "image/webp", upsert: false });
  const after = await exists(bucket, T070_PATH);
  result(!upload.error && after === "present" ? "admin_upload_pass" : "admin_upload_stop");
}

export async function t070Overwrite() {
  const bucket = await adminBucket();
  if (await exists(bucket, T070_PATH) !== "present") result("fixture_not_present");
  const overwrite = await bucket.upload(T070_PATH, WEBP, { contentType: "image/webp", upsert: true });
  const after = await exists(bucket, T070_PATH);
  result(overwrite.error && after === "present" ? "overwrite_denied" : "overwrite_allowed_or_unknown_stop");
}

export async function t070InvalidPrefix() {
  const bucket = await adminBucket();
  if (await exists(bucket, T070_PATH) !== "present" ||
      await exists(bucket, T070_INVALID_PATH) !== "absent") result("invalid_preflight_stop");
  const upload = await bucket.upload(T070_INVALID_PATH, WEBP, { contentType: "image/webp", upsert: false });
  const after = await exists(bucket, T070_INVALID_PATH);
  if (after === "present") result("invalid_prefix_allowed_stop");
  if (after !== "absent") result("state_unknown_stop");
  result(upload.error ? "invalid_prefix_denied" : "invalid_prefix_ambiguous_stop");
}

export async function t070AnonymousDelete() {
  const bucket = await adminBucket();
  if (await exists(bucket, T070_PATH) !== "present") result("fixture_not_present");
  const attempt = await anonymousBucket().remove([T070_PATH]);
  const after = await exists(bucket, T070_PATH);
  if (after === "absent") result("anon_delete_allowed_stop");
  if (after !== "present") result("state_unknown_stop");
  result(attempt.error ? "anon_delete_denied" : "anon_delete_no_effect");
}

export async function t070AuthenticatedDelete() {
  const bucket = await adminBucket();
  if (await exists(bucket, T070_PATH) !== "present") result("fixture_not_present");
  const removal = await bucket.remove([T070_PATH]);
  const after = await exists(bucket, T070_PATH);
  result(!removal.error && after === "absent" ? "admin_delete_pass" : "cleanup_failed_stop");
}
