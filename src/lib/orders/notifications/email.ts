import "server-only";

const EMAIL_TIMEOUT_MS = 5_000;

export function emailNotificationIdempotencyKey(requestId: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) {
    throw new Error("Invalid request identifier.");
  }
  return `order-created-email/${requestId.toLowerCase()}`;
}

export async function sendEmailOrderNotification(
  message: { subject: string; text: string },
  requestId: string,
  config: { apiKey: string; to: string; from: string },
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": emailNotificationIdempotencyKey(requestId),
    },
    body: JSON.stringify({ from: config.from, to: [config.to], subject: message.subject, text: message.text }),
    signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
    cache: "no-store",
    redirect: "error",
  });
  if (!response.ok) throw new Error("Email delivery failed.");
}
