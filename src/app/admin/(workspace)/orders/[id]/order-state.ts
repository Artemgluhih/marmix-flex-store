import type { OrderStatus } from "../orders-list";

export type ActionResult = { kind: "idle" | "saved" | "validation" | "conflict" | "error"; message: string };
export const INITIAL_ACTION_RESULT: ActionResult = { kind: "idle", message: "" };

/** Operational transitions only; the stored order snapshot is immutable. */
export const NEXT_STATUS: Record<OrderStatus, readonly OrderStatus[]> = {
  new: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};
