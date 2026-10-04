import "server-only";

import { formatOrderNotification, type CreatedOrderNotification } from "./format";
import { sendTelegramOrderNotification } from "./telegram";

const CONFIG_NAMES = [
  "ORDER_NOTIFICATIONS_ENABLED", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID",
] as const;

export function missingPreviewNotificationEnvNames(): string[] {
  return CONFIG_NAMES.filter((name) => name === "ORDER_NOTIFICATIONS_ENABLED"
    ? process.env[name] !== "true" : !process.env[name]?.trim());
}

export async function notifyCreatedOrder(created: CreatedOrderNotification): Promise<void> {
  // Explicit Preview gate remains closed even if values are accidentally set in Production.
  if (process.env.VERCEL_ENV !== "preview" || process.env.ORDER_NOTIFICATIONS_ENABLED !== "true") return;
  if (missingPreviewNotificationEnvNames().length) return;

  try {
    await sendTelegramOrderNotification(formatOrderNotification(created), {
      token: process.env.TELEGRAM_BOT_TOKEN!,
      chatId: process.env.TELEGRAM_CHAT_ID!,
    });
  } catch {
    // The order is already committed. Never log provider errors: URLs may contain bot
    // tokens and responses may echo private message text.
  }
}
