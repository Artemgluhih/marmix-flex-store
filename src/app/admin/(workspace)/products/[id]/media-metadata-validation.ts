export const IMAGE_ROLES = [
  { value: "neutral_texture", label: "Нейтральная фактура" },
  { value: "macro", label: "Макро" },
  { value: "interior", label: "Интерьер" },
  { value: "application", label: "Применение" },
] as const;

export type ImageRole = (typeof IMAGE_ROLES)[number]["value"];
export type MediaEdit = { id: string; role: ImageRole | null; alt: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateMediaEdits(items: MediaEdit[], primaryId: string | null): MediaEdit[] | null {
  if (!Array.isArray(items) || items.length > 100) return null;
  const ids = new Set<string>();
  const normalized: MediaEdit[] = [];
  for (const item of items) {
    if (!item || typeof item.id !== "string" || !UUID.test(item.id) || ids.has(item.id)) return null;
    ids.add(item.id);
    if (item.role !== null && !IMAGE_ROLES.some(({ value }) => value === item.role)) return null;
    if (item.alt !== null && typeof item.alt !== "string") return null;
    const alt = item.alt?.trim() || null;
    if (alt && (alt.length > 250 || /[<>]/.test(alt))) return null;
    normalized.push({ id: item.id, role: item.role, alt });
  }
  if (primaryId !== null && (!UUID.test(primaryId) || !ids.has(primaryId))) return null;
  return normalized;
}
