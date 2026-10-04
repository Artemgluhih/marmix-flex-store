import "server-only";

import type { PreparedOrder } from "../prepare";

export type CreatedOrderNotification = {
  requestId: string;
  createdAt: string;
  order: PreparedOrder;
};

// Keep untrusted names/comments on one line in plain-text operational messages.
function oneLine(value: string): string {
  return value.replace(/[\r\n\t\u2028\u2029]+/g, " ").trim();
}

function rub(minor: number): string {
  if (!Number.isSafeInteger(minor) || minor < 0) throw new Error("Invalid verified amount.");
  const amount = BigInt(minor);
  return `${new Intl.NumberFormat("ru-RU").format(amount / BigInt(100))},${String(amount % BigInt(100)).padStart(2, "0")} ₽`;
}

export function formatOrderNotification({ requestId, createdAt, order }: CreatedOrderNotification) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) {
    throw new Error("Invalid request identifier.");
  }
  const timestamp = new Date(createdAt);
  if (Number.isNaN(timestamp.getTime()) || order.currency !== "RUB") throw new Error("Invalid verified order.");

  const { contact, items } = order;
  const lines = [
    "Новая заявка Marmix Flex",
    `ID заявки: ${requestId}`,
    `Дата/время: ${timestamp.toISOString()}`,
    `Имя: ${oneLine(contact.name)}`,
    `Телефон: ${oneLine(contact.phone)}`,
    ...(contact.city ? [`Город: ${oneLine(contact.city)}`] : []),
    ...(contact.email ? [`Email: ${oneLine(contact.email)}`] : []),
    "",
    "Позиции:",
    ...items.map((item, index) => [
      `${index + 1}. ${oneLine(item.name)}`,
      `SKU: ${oneLine(item.sku)}`,
      `Количество: ${item.quantity} ${oneLine(item.saleUnit)}`,
      `Цена: ${rub(item.priceMinor)} / ${oneLine(item.priceUnit)}`,
      `Сумма позиции: ${rub(item.lineTotalMinor)}`,
    ].join("\n")),
    "",
    `Итого: ${rub(order.totalMinor)}`,
    ...(contact.comment ? [`Комментарий: ${oneLine(contact.comment)}`] : []),
  ];
  return {
    subject: `Новая заявка Marmix Flex · ${requestId}`,
    text: lines.join("\n"),
  };
}
