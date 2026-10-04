export const PAGE_SIZE = 25;

export const ORDER_STATUSES = ["new", "in_progress", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderSort = "newest" | "oldest";
export type RawOrderListParams = Record<string, string | string[] | undefined>;
export type OrderListParams = {
  status: OrderStatus | "";
  sort: OrderSort;
  page: number;
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  completed: "Завершена",
  cancelled: "Отменена",
};

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

/** URL values never become a PostgREST column or order expression. */
export function parseOrderListParams(raw: RawOrderListParams): OrderListParams {
  const status = single(raw.status);
  const sort = single(raw.sort);
  const page = single(raw.page);
  return {
    status: ORDER_STATUSES.find((allowed) => allowed === status) ?? "",
    sort: sort === "oldest" ? "oldest" : "newest",
    page: /^[1-9]\d{0,5}$/.test(page) ? Math.min(Number(page), 10000) : 1,
  };
}

export function ordersHref(params: OrderListParams, page: number): string {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.sort !== "newest") query.set("sort", params.sort);
  if (page > 1) query.set("page", String(page));
  return `/admin/orders${query.size ? `?${query}` : ""}`;
}
