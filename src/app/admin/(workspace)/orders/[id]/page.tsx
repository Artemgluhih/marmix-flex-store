import type { Metadata } from "next";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin/require-admin";
import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from "../orders-list";
import { displaySaleUnit, formatStoredRub, parseOrderSnapshot, validMinor, validOrderId } from "./snapshot";
import styles from "./order-detail.module.css";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const metadata: Metadata = {
  title: "Заявка — Marmix Flex",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Asia/Yekaterinburg",
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  noStore();
  // A direct detail request repeats the guard; layout authorization alone is insufficient.
  const { supabase } = await requireAdmin("/admin/orders");
  const { id } = await params;
  if (!validOrderId(id)) notFound();

  const { data: order, error } = await supabase.from("order_requests")
    .select("id,created_at,status,name,phone,city,email,comment,items_snapshot,total_minor,currency")
    .eq("id", id).maybeSingle();
  if (error) throw new Error("Не удалось загрузить заявку.");
  if (!order) notFound();

  const items = parseOrderSnapshot(order.items_snapshot);
  const status = ORDER_STATUSES.find((value) => value === order.status) as OrderStatus | undefined;
  const createdAt = new Date(order.created_at);
  const validHeader = status && Number.isFinite(createdAt.getTime()) && validMinor(order.total_minor) && order.currency === "RUB" &&
    typeof order.name === "string" && typeof order.phone === "string";

  return <div className={styles.page}>
    <nav aria-label="Навигация по заявкам" className={styles.breadcrumb}>
      <Link href="/admin/orders">Заявки</Link><span aria-hidden="true"> / </span><span>Заявка № {order.id.slice(0, 8)}</span>
    </nav>
    <header className={styles.header}>
      <p className={styles.eyebrow}>Рабочее пространство / Заявки</p>
      <h1>Заявка № {order.id.slice(0, 8)}</h1>
      <p className={styles.fullId}>ID: {order.id}</p>
      {validHeader && <div className={styles.meta}>
        <span className={styles.status}>{STATUS_LABELS[status]}</span>
        <time dateTime={order.created_at}>Получена {dateFormatter.format(createdAt)} · Сургут</time>
      </div>}
    </header>

    {!validHeader || !items ? <section className={styles.integrity} role="alert" aria-labelledby="snapshot-error">
      <h2 id="snapshot-error">Данные заявки требуют проверки</h2>
      <p>Не удалось безопасно показать сохранённый состав заявки. Исходные данные не изменены.</p>
    </section> : <>
      <section className={styles.contacts} aria-labelledby="order-contact-heading">
        <h2 id="order-contact-heading">Контактные данные</h2>
        <dl>
          <div><dt>Имя</dt><dd>{order.name}</dd></div>
          <div><dt>Телефон</dt><dd>{order.phone}</dd></div>
          {order.city && <div><dt>Город</dt><dd>{order.city}</dd></div>}
          {order.email && <div><dt>Email</dt><dd>{order.email}</dd></div>}
          {order.comment && <div className={styles.comment}><dt>Комментарий</dt><dd>{order.comment}</dd></div>}
        </dl>
      </section>

      <section className={styles.items} aria-labelledby="order-items-heading">
        <h2 id="order-items-heading">Состав заявки</h2>
        <div className={styles.tableFrame}><table>
          <thead><tr><th scope="col">SKU</th><th scope="col">Товар</th><th scope="col">Количество</th><th scope="col">Цена</th><th scope="col">Сумма</th></tr></thead>
          <tbody>{items.map((item, index) => <tr key={`${item.productId}-${index}`}>
            <td data-label="SKU" className={styles.sku}>{item.sku}</td>
            <td data-label="Товар" className={styles.productName}>{item.name}</td>
            <td data-label="Количество">{item.quantity} {displaySaleUnit(item.saleUnit)}</td>
            <td data-label="Цена">{formatStoredRub(item.priceMinor)} / {item.priceUnit}</td>
            <td data-label="Сумма" className={styles.amount}>{formatStoredRub(item.lineTotalMinor)}</td>
          </tr>)}</tbody>
        </table></div>
        {items.reduce((sum, item) => sum + BigInt(item.lineTotalMinor), BigInt(0)) !== BigInt(order.total_minor) &&
          <p className={styles.warning} role="status">Сумма сохранённых строк отличается от сохранённого итога. Проверьте исходную заявку.</p>}
        <p className={styles.total}><span>Итог заявки</span><strong>{formatStoredRub(order.total_minor)}</strong></p>
        <p className={styles.currency}>Валюта: {order.currency}</p>
      </section>
    </>}
  </div>;
}
