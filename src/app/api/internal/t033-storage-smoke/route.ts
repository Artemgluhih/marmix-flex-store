import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { requireAdminMutation } from "@/lib/admin/require-admin";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Temporary Preview-only technical check. Remove after T033 verification.
// The caller's Auth JWT, never a secret key, is used for Storage mutations.
const image = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==",
  "base64",
);

export async function POST() {
  if (process.env.VERCEL_ENV !== "preview") notFound();
  const { supabase } = await requireAdminMutation();
  const anon = createPublicSupabaseClient();
  const folder = `products/${randomUUID()}`;
  const name = `test_only_${randomUUID()}.png`;
  const path = `${folder}/${name}`;
  const bucket = supabase.storage.from("product-media");
  const guestBucket = anon.storage.from("product-media");
  const result = {
    adminUpload: false, adminSelect: false, adminDelete: false,
    anonUploadDenied: false, anonDeleteDenied: false,
    wrongBucketDenied: false, wrongPrefixDenied: false,
    unsupportedMimeDenied: false, overwriteDenied: false,
    publicRead: false, unchangedAfterOverwrite: false, cleanup: false,
  };
  const attemptedPaths = [path];

  try {
    result.anonUploadDenied = Boolean((await guestBucket.upload(path, image, { contentType: "image/png", upsert: false })).error);
    const upload = await bucket.upload(path, image, { contentType: "image/png", upsert: false });
    result.adminUpload = !upload.error;
    if (result.adminUpload) {
      const listing = await bucket.list(folder, { limit: 10 });
      result.adminSelect = !listing.error && Boolean(listing.data?.some((file) => file.name === name));
      await guestBucket.remove([path]);
      const afterAnonDelete = await bucket.list(folder, { limit: 10 });
      result.anonDeleteDenied = !afterAnonDelete.error &&
        Boolean(afterAnonDelete.data?.some((file) => file.name === name));

      const { data: publicUrl } = bucket.getPublicUrl(path);
      const response = await fetch(publicUrl.publicUrl, { cache: "no-store" });
      const firstBytes = Buffer.from(await response.arrayBuffer());
      result.publicRead = response.ok && firstBytes.equals(image);

      result.overwriteDenied = Boolean((await bucket.upload(path, Buffer.from("TEST_ONLY_REPLACEMENT"), {
        contentType: "image/png", upsert: false,
      })).error);
      const afterOverwrite = await fetch(publicUrl.publicUrl, { cache: "no-store" });
      result.unchangedAfterOverwrite = afterOverwrite.ok && Buffer.from(await afterOverwrite.arrayBuffer()).equals(image);

      result.wrongBucketDenied = Boolean((await supabase.storage.from("t033-no-such-bucket")
        .upload(path, image, { contentType: "image/png", upsert: false })).error);
      const invalid = ["test_only_root_12345678.png", `avatars/${randomUUID()}/test_only_12345678.png`,
        "products/not-a-uuid/test_only_12345678.png", `${folder}/nested/test_only_12345678.png`];
      const wrongResults = [];
      for (const wrongPath of invalid) {
        const attempt = await bucket.upload(wrongPath, image, { contentType: "image/png", upsert: false });
        wrongResults.push(Boolean(attempt.error));
        if (!attempt.error) attemptedPaths.push(wrongPath);
      }
      result.wrongPrefixDenied = wrongResults.every(Boolean);
      const mimePath = `${folder}/test_only_svg_12345678.png`;
      const mimeAttempt = await bucket.upload(mimePath, Buffer.from("TEST_ONLY_MIME"),
        { contentType: "image/svg+xml", upsert: false });
      result.unsupportedMimeDenied = Boolean(mimeAttempt.error);
      if (!mimeAttempt.error) attemptedPaths.push(mimePath);
    }
  } catch {
    // No internal exception, path, token, or object URL leaves the response.
  } finally {
    try {
      const removed = await bucket.remove(attemptedPaths);
      const check = await bucket.list(folder, { limit: 100 });
      result.cleanup = !check.error && !check.data?.length;
      result.adminDelete = result.adminUpload && !removed.error && result.cleanup;
    } catch {
      result.cleanup = false;
      result.adminDelete = false;
    }
  }
  return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
}
