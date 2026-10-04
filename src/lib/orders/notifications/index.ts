import "server-only";

import { formatOrderNotification, type CreatedOrderNotification } from "./format";
import { sendTelegramOrderNotification } from "./telegram";
import { sendEmailOrderNotification } from "./email";

const CONFIG_NAMES = [
  "ORDER_NOTIFICATIONS_ENABLED", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID",
  "RESEND_API_KEY", "ORDER_NOTIFICATION_EMAIL_TO", "ORDER_NOTIFICATION_EMAIL_FROM",
] as const;

export function missingPreviewNotificationEnvNames(): string[] {
  return CONFIG_NAMES.filter((name) => name === "ORDER_NOTIFICATIONS_ENABLED"
    ? process.env[name] !== "true" : !process.env[name]?.trim());
}

export async function notifyCreatedOrder(created: CreatedOrderNotification): Promise<void> {
  // Explicit Preview gate remains closed even if values are accidentally set in Production.
  if (process.env.VERCEL_ENV !== "preview" || process.env.ORDER_NOTIFICATIONS_ENABLED !== "true") return;
  if (missingPreviewNotificationEnvNames().length) return;

  const message = formatOrderNotification(created);
  const results = await Promise.allSettled([
    sendTelegramOrderNotification(message.text, {
      token: process.env.TELEGRAM_BOT_TOKEN!,
      chatId: process.env.TELEGRAM_CHAT_ID!,
    }),
    sendEmailOrderNotification(message, created.requestId, {
      apiKey: process.env.RESEND_API_KEY!,
      to: process.env.ORDER_NOTIFICATION_EMAIL_TO!,
      from: process.env.ORDER_NOTIFICATION_EMAIL_FROM!,
    }),
  ]);
  // Provider failures are intentionally isolated. Never log errors: URLs may contain bot
  // tokens and provider responses may echo private message text.
  void results;
}
