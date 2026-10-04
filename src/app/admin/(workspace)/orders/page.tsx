import type { Metadata } from "next";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { requireAdmin } from "@/lib/admin/require-admin";
import {
  PAGE_SIZE, STATUS_LABELS, ordersHref, parseOrderListParams,
  type OrderStatus, type RawOrderListParams,
} from "./orders-list";
import styles from "./orders.module.css";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const metadata: Metadata = {
  title: "Заявки — Marmix Flex",
  robots: { index: false, follow: false },
};

type OrderRow = {
  id: string;
  created_at: string;
  status: OrderStatus;
  name: string;
  phone: string;
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Asia/Yekaterinburg",
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<RawOrderListParams>;
}) {
  noStore();
  // This private read has its own guard, independent of the workspace layout.
  const { supabase } = await requireAdmin("/admin/orders");
  const params = parseOrderListParams(await searchParams);

  let countQuery = supabase.from("order_requests").select("id", { count: "exact", head: true });
  if (params.status) countQuery = countQuery.eq("status", params.status);
  const counted = await countQuery;
  const { count, error: countError } = counted;
  if (countError || count === null) throw new Error("Не удалось загрузить список заявок.");

  const total = count;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(params.page, pages);
  let databaseEmpty = total === 0 && !params.status;
  if (total === 0 && params.status) {
    const baseline = await supabase.from("order_requests").select("id", { count: "exact", head: true });
    if (baseline.error || baseline.count === null) throw new Error("Не удалось загрузить список заявок.");
    databaseEmpty = baseline.count === 0;
  }

  let orders: OrderRow[] = [];
  if (total > 0) {
    const ascending = params.sort === "oldest";
    let listQuery = supabase.from("order_requests").select("id,created_at,status,name,phone");
    if (params.status) listQuery = listQuery.eq("status", params.status);
    const result = await listQuery.order("created_at", { ascending }).order("id", { ascending })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (result.error || !result.data) throw new Error("Не удалось загрузить список заявок.");
    orders = result.data as OrderRow[];
  }

  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);
  return <div className={styles.page}>
    <header className={styles.heading}>
      <p className={styles.eyebrow}>Рабочее пространство / Заявки</p>
      <h1>Заявки</h1>
      <p>Новые обращения и их текущий статус.</p>
    </header>

    <form className={styles.filters} action="/admin/orders" method="get" role="search">
      <div className={styles.filterControl}>
        <label htmlFor="orders-status">Статус</label>
        <select id="orders-status" name="status" defaultValue={params.status}>
          <option value="">Все статусы</option>
          <option value="new">Новые</option>
          <option value="in_progress">В работе</option>
          <option value="completed">Завершённые</option>
          <option value="cancelled">Отменённые</option>
        </select>
      </div>
      <div className={styles.filterControl}>
        <label htmlFor="orders-sort">Дата</label>
        <select id="orders-sort" name="sort" defaultValue={params.sort}>
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
        </select>
      </div>
      <div className={styles.filterActions}>
        <button type="submit">Применить</button>
        <Link href="/admin/orders">Сбросить</Link>
      </div>
    </form>

    <p className={styles.resultCount} aria-live="polite">
      {total === 0 ? "Найдено: 0" : `Показаны ${first}–${last} из ${total}`}
    </p>
    {orders.length === 0 ? (
      <section className={styles.empty} aria-labelledby="empty-orders">
        <h2 id="empty-orders">{databaseEmpty ? "Заявок пока нет" : "По выбранному статусу заявок нет"}</h2>
        <p>{databaseEmpty ? "Когда появится новая заявка, она будет видна здесь." : "Выберите другой статус или сбросьте фильтр."}</p>
      </section>
    ) : (
      <div className={styles.tableFrame}>
        <table className={styles.table}>
          <thead><tr>
            <th scope="col">Номер заявки</th>
            <th scope="col">Дата</th>
            <th scope="col">Статус</th>
            <th scope="col">Имя</th>
            <th scope="col">Телефон</th>
          </tr></thead>
          <tbody>
            {orders.map((order) => <tr key={order.id}>
              <td className={styles.requestId}><span className={styles.mobileLabel} aria-hidden="true">Номер заявки</span>
                <span title={order.id} aria-label={`Заявка ${order.id}`}>№ {order.id.slice(0, 8)}</span></td>
              <td className={styles.date}><span className={styles.mobileLabel} aria-hidden="true">Дата · Сургут</span>
                <time dateTime={order.created_at}>{dateFormatter.format(new Date(order.created_at))}</time></td>
              <td><span className={styles.mobileLabel} aria-hidden="true">Статус</span>
                <span className={`${styles.badge} ${styles[order.status] ?? ""}`}>{STATUS_LABELS[order.status] ?? "—"}</span></td>
              <td className={styles.name}><span className={styles.mobileLabel} aria-hidden="true">Имя</span>{order.name}</td>
              <td className={styles.phone}><span className={styles.mobileLabel} aria-hidden="true">Телефон</span>{order.phone}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    )}
    {total > PAGE_SIZE && <nav className={styles.pagination} aria-label="Страницы списка заявок">
      {page > 1 ? <Link href={ordersHref(params, page - 1)} rel="prev">← Предыдущая</Link>
        : <span aria-disabled="true">← Предыдущая</span>}
      <span>Страница {page} из {pages}</span>
      {page < pages ? <Link href={ordersHref(params, page + 1)} rel="next">Следующая →</Link>
        : <span aria-disabled="true">Следующая →</span>}
    </nav>}
  </div>;
}
