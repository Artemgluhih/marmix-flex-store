"use server";

import { revalidatePath } from "next/cache";

import { requireAdminMutation } from "@/lib/admin/require-admin";
import { ORDER_STATUSES, type OrderStatus } from "../orders-list";
import { NEXT_STATUS, type ActionResult } from "./order-state";
import { validOrderId } from "./snapshot";

function field(data: FormData, name: string): string | null {
  const value = data.get(name);
  return typeof value === "string" ? value : null;
}

function status(value: string | null): OrderStatus | null {
  return ORDER_STATUSES.find((candidate) => candidate === value) ?? null;
}

function token(data: FormData) {
  const id = field(data, "id");
  const expectedStatus = status(field(data, "expected_status"));
  const expectedUpdatedAt = field(data, "expected_updated_at");
  if (!id || !validOrderId(id) || !expectedStatus || !expectedUpdatedAt ||
      expectedUpdatedAt.length > 64 ||
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(expectedUpdatedAt) ||
      !Number.isFinite(Date.parse(expectedUpdatedAt))) return null;
  return { id, expectedStatus, expectedUpdatedAt };
}

const VALIDATION: ActionResult = { kind: "validation", message: "Проверьте введённые данные и повторите действие." };
const CONFLICT: ActionResult = { kind: "conflict", message: "Заявка уже была изменена. Обновите страницу и повторите действие." };
const ERROR: ActionResult = { kind: "error", message: "Не удалось сохранить изменения. Повторите попытку." };

function finish(id: string, saved: "status" | "note"): ActionResult {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return { kind: "saved", message: saved === "status" ? "Статус сохранён." : "Внутренняя заметка сохранена." };
}

export async function saveOrderStatus(_previous: ActionResult, data: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdminMutation();
  const current = token(data);
  const next = status(field(data, "status"));
  if (!current || !next) return VALIDATION;
  if (next === current.expectedStatus) {
    const existing = await supabase.from("order_requests").select("status,updated_at")
      .eq("id", current.id).maybeSingle();
    if (existing.error) return ERROR;
    if (existing.data?.status !== current.expectedStatus ||
        existing.data.updated_at !== current.expectedUpdatedAt) return CONFLICT;
    return finish(current.id, "status");
  }
  if (!NEXT_STATUS[current.expectedStatus].includes(next)) return VALIDATION;

  const result = await supabase.from("order_requests").update({ status: next })
    .eq("id", current.id).eq("status", current.expectedStatus)
    .eq("updated_at", current.expectedUpdatedAt).select("id").maybeSingle();
  if (result.error) return ERROR;
  if (!result.data) return CONFLICT;
  return finish(current.id, "status");
}

export async function saveOrderNote(_previous: ActionResult, data: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdminMutation();
  const current = token(data);
  const submitted = field(data, "internal_note");
  if (!current || submitted === null || submitted.length > 2000) return VALIDATION;
  const note = submitted.trim() || null;

  const result = await supabase.from("order_requests").update({ internal_note: note })
    .eq("id", current.id).eq("status", current.expectedStatus)
    .eq("updated_at", current.expectedUpdatedAt).select("id").maybeSingle();
  if (result.error) return ERROR;
  if (!result.data) return CONFLICT;
  return finish(current.id, "note");
}
