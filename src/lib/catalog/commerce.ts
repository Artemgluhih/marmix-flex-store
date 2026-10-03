import type { PublicProduct } from "./types";

// UI safety bound, not a business maximum or an ordering rule.
export const MAX_DISPLAY_QUANTITY = 9999;

type CommerceFields = Pick<PublicProduct,
  "priceMinor" | "currency" | "priceUnit" | "saleUnit" | "minQuantity" |
  "quantityStep" | "areaPerSaleUnitM2" | "availabilityStatus"
>;

export type QuantityViewModel = {
  min: number;
  step: number;
  max: number;
  saleUnit: string;
  area: { numerator: string; denominator: string } | null;
  calculation: { priceMinor: number; numerator: string; denominator: string } | null;
  commercialStatus: "incomplete" | "ready";
};

function positiveDecimalRatio(value: number | null): { numerator: string; denominator: string } | null {
  if (value === null || !Number.isFinite(value)) return null;
  const decimal = String(value);
  if (!/^\d+(?:\.\d+)?$/.test(decimal)) return null;
  const [whole, fraction = ""] = decimal.split(".");
  const numerator = BigInt(whole + fraction);
  if (numerator <= BigInt(0)) return null;
  return { numerator: numerator.toString(), denominator: (BigInt(10) ** BigInt(fraction.length)).toString() };
}

export function evaluateCommerce(product: CommerceFields, publicEligible: boolean): QuantityViewModel | null {
  const { minQuantity: min, quantityStep: step, saleUnit, priceUnit, priceMinor, availabilityStatus } = product;
  if (!saleUnit || !Number.isSafeInteger(min) || !Number.isSafeInteger(step) ||
      min === null || step === null || min < 1 || step < 1 || min > MAX_DISPLAY_QUANTITY) return null;
  const max = min + Math.floor((MAX_DISPLAY_QUANTITY - min) / step) * step;
  const area = saleUnit === "sheet" ? positiveDecimalRatio(product.areaPerSaleUnitM2) : null;
  const isPriceValid = Number.isSafeInteger(priceMinor) && priceMinor !== null && priceMinor > 0 && product.currency === "RUB";
  const isAvailable = availabilityStatus === "in_stock" || availabilityStatus === "on_order";
  const conversion = priceUnit === saleUnit ? { numerator: "1", denominator: "1" }
    : saleUnit === "sheet" && priceUnit === "м²" ? area : null;
  const exactForEveryStep = isPriceValid && conversion !== null &&
    (BigInt(priceMinor!) * BigInt(conversion.numerator) * BigInt(min)) % BigInt(conversion.denominator) === BigInt(0) &&
    (BigInt(priceMinor!) * BigInt(conversion.numerator) * BigInt(step)) % BigInt(conversion.denominator) === BigInt(0);
  const complete = publicEligible && isPriceValid && isAvailable && exactForEveryStep;
  return {
    min, step, max, saleUnit, area,
    calculation: complete ? { priceMinor: priceMinor!, ...conversion! } : null,
    commercialStatus: complete ? "ready" : "incomplete",
  };
}

export function validQuantity(model: Pick<QuantityViewModel, "min" | "step" | "max">, value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) &&
    value >= model.min && value <= model.max && (value - model.min) % model.step === 0;
}

export function exactArea(model: QuantityViewModel, quantity: unknown): string | null {
  if (!model.area || !validQuantity(model, quantity)) return null;
  return decimalQuotient(BigInt(quantity) * BigInt(model.area.numerator), BigInt(model.area.denominator));
}

function decimalQuotient(numerator: bigint, denominator: bigint): string {
  const digits = denominator.toString().length - 1;
  const whole = numerator / denominator;
  const remainder = numerator % denominator;
  if (!remainder) return whole.toString();
  return `${whole}.${remainder.toString().padStart(digits, "0").replace(/0+$/, "")}`;
}

export function exactTotalMinor(model: QuantityViewModel, quantity: unknown): number | null {
  if (!model.calculation || !validQuantity(model, quantity)) return null;
  const { priceMinor, numerator, denominator } = model.calculation;
  const cents = BigInt(quantity) * BigInt(priceMinor) * BigInt(numerator);
  const divisor = BigInt(denominator);
  if (cents % divisor !== BigInt(0)) return null; // Rounding policy has not been approved.
  const result = cents / divisor;
  return result <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(result) : null;
}
