"use client";

import { useState } from "react";
import { submitTechnicalTelegramReview } from "./actions";
import styles from "../checkout/checkout.module.css";

type Result = Awaited<ReturnType<typeof submitTechnicalTelegramReview>>;

export function ReviewClient() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit() {
    if (busy) return;
    setBusy(true);
    try { setResult(await submitTechnicalTelegramReview()); }
    catch { setResult({ state: "unavailable" }); }
    finally { setBusy(false); }
  }

  return <div className={styles.state}>
    <h2>Изолированная проверка Telegram</h2>
    <p>Фиксированные synthetic TEST_ONLY данные. Товар не создаётся в каталоге.</p>
    <button type="button" className={styles.submit} onClick={submit} disabled={busy}>
      {busy ? "Отправка…" : "Создать / повторить тестовую заявку"}
    </button>
    <p role="status" aria-live="polite">
      {result?.state === "created" && `Создана TEST_ONLY заявка ${result.id}. Итог: ${new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(result.totalMinor / 100)}.`}
      {result?.state === "replayed" && `Повтор: прежний ID ${result.id}; новое уведомление не отправлено.`}
      {result?.state === "unavailable" && "Проверка недоступна. Заявка могла быть создана; повторите с тем же ключом."}
    </p>
  </div>;
}
