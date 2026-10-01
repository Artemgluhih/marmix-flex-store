export const MEDIA_BUCKET = "product-media";
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

const formats = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/avif": ["avif"],
} as const;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const ID = new RegExp(`^${UUID}$`, "i");
const KEY = new RegExp(`^products/(${UUID})/([A-Za-z0-9_-]{8,128})\\.(jpg|jpeg|png|webp|avif)$`, "i");

export function mediaPathFor(productId: string, key: string, ext: string) {
  if (!ID.test(productId) || !/^[A-Za-z0-9_-]{8,128}$/.test(key) || !/^(jpg|jpeg|png|webp|avif)$/.test(ext)) {
    throw new Error("Некорректный путь изображения.");
  }
  return `products/${productId}/${key}.${ext}`;
}

export function validMediaPath(productId: string, path: string) {
  const match = KEY.exec(path);
  return Boolean(match && match[1].toLowerCase() === productId.toLowerCase());
}

export function validateImageFile(file: File): { extension: string } | { error: string } {
  if (!file.size) return { error: "Выберите непустой файл изображения." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Размер изображения не должен превышать 12 МБ." };
  const allowed = formats[file.type as keyof typeof formats];
  if (!allowed) return { error: "Поддерживаются только JPEG, PNG, WebP и AVIF." };
  const extension = file.name.split(".").at(-1)?.toLowerCase();
  if (!extension || !allowed.some((value) => value === extension)) {
    return { error: "Расширение файла не соответствует формату изображения." };
  }
  return { extension };
}

export function validImageDimensions(width: number, height: number) {
  return Number.isSafeInteger(width) && width > 0 && width <= 100000 &&
    Number.isSafeInteger(height) && height > 0 && height <= 100000;
}
