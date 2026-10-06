export const contactPhone = {
  label: "+7 (346) 299-96-76",
  href: "tel:+73462999676",
} as const;

export const contactLocations = [
  { city: "Сургут", address: "г. Сургут, Декабристов 1А" },
  { city: "Москва", address: "г. Москва, Товарищеский переулок, 13, Офис 4" },
] as const;

export function addressMapUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
