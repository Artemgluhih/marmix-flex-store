import "server-only";

export const T070_BUCKET = "product-media";
export const T070_PATH = "products/937166d4-fecf-4fac-8d40-3dc74286f557/TEST_ONLY_T070_937166d4.webp";
export const T070_INVALID_PATH = "t070-invalid/TEST_ONLY_T070_937166d4.webp";

/** This route must fail closed outside this one Preview branch and project. */
export function t070StorageQaEnabled(): boolean {
  return process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_TARGET_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "t070-preview-review" &&
    process.env.VERCEL_PROJECT_ID === "prj_2OI4vP4GIX3e99xbE7iF5NrBbdA2";
}
