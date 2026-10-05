"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { STATUS_LABELS, type OrderStatus } from "../orders-list";
import { saveOrderNote, saveOrderStatus } from "./order-actions";
import { INITIAL_ACTION_RESULT, NEXT_STATUS, type ActionResult } from "./order-state";
import styles from "./order-detail.module.css";

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button className={styles.save} type="submit" disabled={pending}>
    {pending ? "Сохранение…" : children}
  </button>;
}

function Feedback({ result }: { result: ActionResult }) {
  return result.kind === "idle" ? null : <p className={result.kind === "saved" ? styles.success : styles.feedback}
    role={result.kind === "saved" ? "status" : "alert"} aria-live="polite">{result.message}
    {result.kind === "conflict" && <> <a href="" className={styles.reload}>Обновить страницу</a></>}
  </p>;
}

type Props = {
  id: string;
  status: OrderStatus;
  updatedAt: string;
  note: string | null;
};

export function OrderControls({ id, status, updatedAt, note }: Props) {
  const [statusResult, statusAction] = useActionState(saveOrderStatus, INITIAL_ACTION_RESULT);
  const [noteResult, noteAction] = useActionState(saveOrderNote, INITIAL_ACTION_RESULT);
  const next = NEXT_STATUS[status];

  return <section className={styles.management} aria-labelledby="order-management-heading">
    <h2 id="order-management-heading">Управление заявкой</h2>
    <div className={styles.managementGrid}>
      <div className={styles.operation}>
        <h3>Статус</h3>
        <p className={styles.current}>Сейчас: {STATUS_LABELS[status]}</p>
        {next.length ? <form action={statusAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="expected_status" value={status} />
          <input type="hidden" name="expected_updated_at" value={updatedAt} />
          <label htmlFor="next-order-status">Следующий статус</label>
          <select key={status} id="next-order-status" name="status" defaultValue="" required>
            <option value="" disabled>Выберите статус</option>
            {next.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}
          </select>
          <Submit>Изменить статус</Submit>
          <Feedback result={statusResult} />
        </form> : <p className={styles.terminal}>Заявка завершена. Дальнейшие переходы статуса недоступны.</p>}
      </div>
      <div className={styles.operation}>
        <h3>Внутренняя заметка</h3>
        <p className={styles.hint}>Видна только администраторам.</p>
        <form action={noteAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="expected_status" value={status} />
          <input type="hidden" name="expected_updated_at" value={updatedAt} />
          <label htmlFor="order-internal-note">Текст заметки</label>
          <textarea key={updatedAt} id="order-internal-note" name="internal_note" maxLength={2000} rows={5} defaultValue={note ?? ""} />
          <Submit>Сохранить заметку</Submit>
          <Feedback result={noteResult} />
        </form>
      </div>
    </div>
  </section>;
}
