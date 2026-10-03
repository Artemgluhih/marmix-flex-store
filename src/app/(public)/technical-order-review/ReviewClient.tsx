"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { submitTechnicalOrder } from "./actions";
import styles from "../checkout/checkout.module.css";

type Mode = Parameters<typeof submitTechnicalOrder>[0];
type Result = Awaited<ReturnType<typeof submitTechnicalOrder>>;

export function ReviewClient({ privateConfigReady }: { privateConfigReady: boolean }) {
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [technicalCart, setTechnicalCart] = useState(true);

  async function send(mode: Mode) {
    if (lock.current || (!privateConfigReady && mode !== "changed" && mode !== "error")) return;
    lock.current = true;
    setPending(true);
    setResult(null);
    try {
      const next = await submitTechnicalOrder(mode);
      setResult(next);
      if (next.state === "created" || next.state === "replayed") setTechnicalCart(false);
    } catch {
      setResult({ state: "error" });
    } finally {
      setPending(false);
      lock.current = false;
    }
  }

  return <div className={styles.state}>
    <h2>Техническая отправка</h2>
    <p>Только Preview и синтетические данные. Позиция TEST_ONLY формируется на сервере для проверки записи; она не является товаром каталога.</p>
    <p>3 листа × 4.0328 м² × 2 000 ₽/м² = 24 196,80 ₽. Пустые город, email и комментарий записываются как NULL.</p>
    <p role="status">{pending ? "Отправляем тестовую заявку…" : technicalCart ? "Техническая позиция подготовлена." : "Техническая позиция очищена после подтверждённого ответа."}</p>
    <div className={styles.formActions}>
      <button className={styles.check} type="button" disabled={pending || !privateConfigReady} onClick={() => send("submit")}>Отправить TEST_ONLY</button>
      <button className={styles.check} type="button" disabled={pending || !privateConfigReady} onClick={() => send("retry")}>Повторить с тем же ключом</button>
      <button className={styles.check} type="button" disabled={pending || !privateConfigReady} onClick={() => send("conflict")}>Изменить intent с тем же ключом</button>
      <button className={styles.check} type="button" disabled={pending || !privateConfigReady} onClick={() => send("race")}>Два параллельных TEST_ONLY запроса</button>
      <button className={styles.check} type="button" disabled={pending || !privateConfigReady} onClick={() => send("negative")}>Проверить API отказ без записи</button>
      <button className={styles.check} type="button" disabled={pending} onClick={() => send("changed")}>Корзина изменилась</button>
      <button className={styles.check} type="button" disabled={pending} onClick={() => send("error")}>Сетевая ошибка / retry</button>
    </div>
    {result && <div role={result.state === "created" || result.state === "replayed" || result.state === "race_pass" || result.state === "negative_pass" ? "status" : "alert"}>
      {result.state === "race_pass" ? <p>Обе параллельные попытки вернули один идентификатор: <code>{result.id}</code>.</p>
      : result.state === "negative_pass" ? <p>API сохранил безопасный replay и конфликт, отклонил REAL non-orderable, изменённые данные, ошибочный запрос и чужой Origin без новой записи.</p>
      : (result.state === "created" || result.state === "replayed") ? <>
        <h2>Заявка отправлена</h2><p>Техническая заявка на расчёт/связь. Товар не резервируется; заказ и оплата не подтверждены.</p>
        <p>Идентификатор заявки: <code>{result.id}</code></p>
        {result.state === "replayed" && <p>Повторный запрос вернул тот же идентификатор.</p>}
      </> : result.state === "cart_changed" ? <>
        <p>Данные корзины изменились. Проверьте актуальные позиции.</p><Link className={styles.back} href="/cart">Перейти в корзину</Link>
      </> : result.state === "conflict" ? <p>Ключ уже использован для другой заявки. Для нового intent потребуется новый ключ.</p>
        : <p>Не удалось отправить заявку. Повторите попытку с тем же ключом.</p>}
    </div>}
  </div>;
}
