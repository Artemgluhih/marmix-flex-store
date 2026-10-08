import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin/require-admin";
import { T070_BUCKET, T070_INVALID_PATH, T070_PATH, t070StorageQaEnabled } from "./gate";
import {
  t070Preflight, t070AnonymousUpload, t070AuthenticatedUpload, t070Overwrite,
  t070InvalidPrefix, t070AnonymousDelete, t070AuthenticatedDelete,
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

const messages: Record<string, string> = {
  preflight_clear: "Оба тестовых пути отсутствуют. Сверьте общий baseline Storage = 3 перед записью.",
  preflight_stop: "Путь уже занят или его состояние неизвестно. Остановите проверку.",
  fixture_not_absent: "Точный fixture уже существует или его отсутствие не доказано. Остановите проверку.",
  fixture_not_present: "Точный fixture не найден или состояние не определено. Остановите проверку.",
  anon_upload_denied: "Anonymous upload отклонён; точный путь остался пустым.",
  anon_upload_allowed_stop: "Anonymous upload создал fixture. Остановите тесты и удалите только точный path через Admin.",
  anon_upload_ambiguous_stop: "Anonymous upload не вернул ошибку, но объект не найден. Нужна отдельная проверка.",
  admin_upload_pass: "Authenticated Admin upload создал точный fixture.",
  admin_upload_stop: "Upload не подтверждён. Проверьте точный path и остановите тесты до решения об очистке.",
  overwrite_denied: "Upsert/overwrite отклонён; fixture на месте.",
  overwrite_allowed_or_unknown_stop: "Overwrite не доказан запрещённым. Остановите тесты и исследуйте точный fixture.",
  invalid_preflight_stop: "Неправильный путь уже существует или состояние не определено. Остановите тесты.",
  invalid_prefix_denied: "Upload с неверным префиксом отклонён; объект не создан.",
  invalid_prefix_allowed_stop: "Неправильный префикс был принят. Остановите тесты; не удаляйте широким префиксом.",
  invalid_prefix_ambiguous_stop: "Ответ неверного пути неоднозначен. Остановите тесты.",
  anon_delete_denied: "Anonymous delete отклонён; fixture на месте.",
  anon_delete_no_effect: "Anonymous delete не сообщил об ошибке, но объект сохранился. Эффективного удаления нет.",
  anon_delete_allowed_stop: "Anonymous delete удалил fixture. Остановите тесты: обнаружен дефект доступа.",
  admin_delete_pass: "Authenticated Admin delete удалил точный fixture.",
  cleanup_failed_stop: "Удаление не подтверждено. Остановитесь и сообщите Owner точный path.",
  state_unknown_stop: "Состояние Storage неизвестно. Остановите тесты.",
};

const steps = [
  ["01 — Проверить точные пути", t070Preflight],
  ["02 — Anonymous upload: ожидается отказ", t070AnonymousUpload],
  ["03 — Загрузить тестовый WebP как Admin", t070AuthenticatedUpload],
  ["04 — Проверить запрет overwrite/upsert", t070Overwrite],
  ["05 — Проверить неверный префикс", t070InvalidPrefix],
  ["06 — Anonymous delete: ожидается отказ", t070AnonymousDelete],
  ["07 — Удалить fixture как Admin", t070AuthenticatedDelete],
] as const;

export default async function T070StorageQaPage({
  searchParams,
}: { searchParams: Promise<{ result?: string }> }) {
  if (!t070StorageQaEnabled()) notFound();
  await requireAdmin("/admin/t070-storage-qa");
  const { result } = await searchParams;
  return <main style={{ maxWidth: 850, margin: "0 auto", padding: "2rem" }}>
    <h1>T070 — временная проверка Storage</h1>
    <p>Только Preview review branch. Не связано с реальным товаром. Все действия POST защищены Admin guard и Origin.</p>
    <p>Bucket: <code>{T070_BUCKET}</code><br />Fixture: <code style={{ overflowWrap: "anywhere" }}>{T070_PATH}</code><br />
      Неверный префикс: <code style={{ overflowWrap: "anywhere" }}>{T070_INVALID_PATH}</code></p>
    <p>Перед шагом 02 независимо подтвердите baseline 3 объекта. После любого результата «Остановите» не продолжайте следующие шаги.
      При проблеме cleanup не удаляйте соседние объекты.</p>
    {result && <p role="status" style={{ border: "1px solid currentColor", padding: "1rem" }}>
      {messages[result] ?? "Неизвестный результат. Остановите проверку."}</p>}
    <ol style={{ display: "grid", gap: "1rem", paddingLeft: "1.5rem" }}>
      {steps.map(([label, action]) => <li key={label}><form action={action}>
        <button type="submit" style={{ padding: ".6rem 1rem", cursor: "pointer" }}>{label}</button>
      </form></li>)}
    </ol>
  </main>;
}
