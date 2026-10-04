import "server-only";

const TELEGRAM_TIMEOUT_MS = 5_000;
const MAX_MESSAGE_LENGTH = 4_096;

export async function sendTelegramOrderNotification(
  text: string,
  config: { token: string; chatId: string },
  fetcher: typeof fetch = fetch,
): Promise<void> {
  if (text.length < 1 || text.length > MAX_MESSAGE_LENGTH) throw new Error("Telegram message length unsupported.");
  const response = await fetcher(`https://api.telegram.org/bot${config.token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: config.chatId, text }),
    signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
    cache: "no-store",
    redirect: "error",
  });
  if (!response.ok) throw new Error("Telegram delivery failed.");
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
    throw new Error("Telegram delivery failed.");
  }
}
