export const MAX_CART_IDS = 32;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeCartIds(input: unknown): string[] {
  if (!Array.isArray(input) || input.length > MAX_CART_IDS ||
      input.some((id) => typeof id !== "string" || id.length > 36)) {
    throw new Error("Некорректный список позиций.");
  }
  return [...new Set(input.filter((id): id is string => UUID.test(id)))];
}
