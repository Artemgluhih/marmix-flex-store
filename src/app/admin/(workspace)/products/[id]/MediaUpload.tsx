"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createAdminBrowserSupabaseClient } from "@/lib/supabase/browser-auth";
import { linkUploadedImage } from "./media-actions";
import { saveMediaMetadata } from "./media-metadata-actions";
import { IMAGE_ROLES, type ImageRole } from "./media-metadata-validation";
import { MEDIA_BUCKET, mediaPathFor, validateImageFile, validImageDimensions } from "./media-validation";
import styles from "./media-upload.module.css";

export type ImagePreview = {
  id: string; url: string; width: number; height: number;
  role: ImageRole | null; alt: string | null; sort_order: number; is_primary: boolean;
};
type UploadStatus = "ready" | "invalid" | "uploading" | "uploaded" | "error";
type Selection = { id: string; file: File; preview: string | null; extension: string | null; status: UploadStatus; error?: string };

export function MediaUpload({ productId, images, previewOnly = false }: { productId: string; images: ImagePreview[]; previewOnly?: boolean }) {
  const [selected, setSelected] = useState<Selection[]>([]);
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<ImagePreview[]>(images);
  const [baseline, setBaseline] = useState<ImagePreview[]>(images);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const dragging = useRef<string | null>(null);
  const urls = useRef<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => () => { urls.current.forEach(URL.revokeObjectURL); }, []);

  function chooseFiles(files: FileList | null) {
    urls.current.forEach(URL.revokeObjectURL);
    urls.current = [];
    setSelected(Array.from(files ?? []).map((file): Selection => {
      const validation = validateImageFile(file);
      if ("error" in validation) return { id: crypto.randomUUID(), file, preview: null, extension: null, status: "invalid", error: validation.error };
      const preview = URL.createObjectURL(file);
      urls.current.push(preview);
      return { id: crypto.randomUUID(), file, preview, extension: validation.extension, status: "ready" };
    }));
  }

  function mark(id: string, status: UploadStatus, error?: string) {
    setSelected((current) => current.map((item) => item.id === id ? { ...item, status, error } : item));
  }

  function removeQueued(id: string) {
    if (pending) return;
    const item = selected.find((entry) => entry.id === id);
    if (!item || (item.status !== "ready" && item.status !== "invalid")) return;
    if (item.preview) {
      URL.revokeObjectURL(item.preview);
      urls.current = urls.current.filter((url) => url !== item.preview);
    }
    setSelected((current) => current.filter((entry) => entry.id !== id));
  }

  async function uploadOne(item: Selection, client: ReturnType<typeof createAdminBrowserSupabaseClient>) {
    if (!item.extension) return;
    mark(item.id, "uploading");
    let path: string | null = null;
    let dimensions: { width: number; height: number } | null = null;
    const bucket = client.storage.from(MEDIA_BUCKET);
    try {
      const bitmap = await createImageBitmap(item.file);
      dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      if (!validImageDimensions(dimensions.width, dimensions.height)) {
        mark(item.id, "error", "Не удалось определить размеры изображения."); return;
      }
      path = mediaPathFor(productId, crypto.randomUUID(), item.extension);
      const uploaded = await bucket.upload(path, item.file, { contentType: item.file.type, upsert: false });
      if (uploaded.error) {
        // A collision must never remove the pre-existing object.
        path = null; mark(item.id, "error", "Не удалось загрузить файл. Проверьте доступ и повторите попытку."); return;
      }
      const linked = await linkUploadedImage(productId, path, dimensions.width, dimensions.height);
      if (!linked.ok) {
        const cleanup = await bucket.remove([path]);
        mark(item.id, "error", cleanup.error
          ? linked.error + " Загруженный файл не удалось очистить; сообщите администратору."
          : linked.error);
        return;
      }
      const url = bucket.getPublicUrl(path).data.publicUrl;
      const image: ImagePreview = { id: linked.id, url, width: dimensions!.width, height: dimensions!.height,
        role: null, alt: null, sort_order: 0, is_primary: false };
      setSaved((current) => [...current, { ...image, sort_order: Math.max(-1, ...current.map(({ sort_order }) => sort_order)) + 1 }]);
      setBaseline((current) => [...current, { ...image, sort_order: Math.max(-1, ...current.map(({ sort_order }) => sort_order)) + 1 }]);
      mark(item.id, "uploaded");
    } catch {
      if (!path) { mark(item.id, "error", "Файл не удалось прочитать. Выберите исправное изображение."); return; }
      // Lost response after a committed insert: preserve the object if its relation exists.
      try {
        const relation = await client.from("product_images").select("id")
          .eq("product_id", productId).eq("storage_path", path).maybeSingle();
        if (relation.error) throw relation.error;
        if (relation.data && dimensions) {
          const url = bucket.getPublicUrl(path).data.publicUrl;
          const image: ImagePreview = { id: relation.data!.id, url, width: dimensions!.width, height: dimensions!.height,
            role: null, alt: null, sort_order: 0, is_primary: false };
          setSaved((current) => [...current, { ...image, sort_order: Math.max(-1, ...current.map(({ sort_order }) => sort_order)) + 1 }]);
          setBaseline((current) => [...current, { ...image, sort_order: Math.max(-1, ...current.map(({ sort_order }) => sort_order)) + 1 }]);
          mark(item.id, "uploaded"); return;
        }
        const cleanup = await bucket.remove([path]);
        mark(item.id, "error", cleanup.error
          ? "Загрузка прервалась; файл не удалось очистить. Сообщите администратору."
          : "Загрузка не завершилась. Повторите попытку.");
      } catch {
        mark(item.id, "error", "Не удалось проверить результат загрузки. Обновите страницу и сообщите администратору, если файл отсутствует.");
      }
    }
  }

  async function upload() {
    if (pending || saving) return;
    const candidates = selected.filter((item) => item.status === "ready" || item.status === "error");
    if (!candidates.length) return;
    setPending(true);
    try {
      const client = createAdminBrowserSupabaseClient();
      const user = await client.auth.getUser();
      if (user.error || !user.data.user) {
        candidates.forEach((item) => mark(item.id, "error", "Сессия истекла. Войдите в Admin повторно."));
        return;
      }
      // Sequential, isolated object and relation per file. One failure does not undo successes.
      for (const item of candidates) await uploadOne(item, client);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      candidates.forEach((item) => mark(item.id, "error", "Загрузка недоступна. Повторите попытку."));
    } finally { setPending(false); }
  }

  function editImage(id: string, patch: Partial<Pick<ImagePreview, "alt" | "role">>) {
    setSaved((current) => current.map((image) => image.id === id ? { ...image, ...patch } : image));
    setSaveMessage("");
    setSaveError("");
  }

  function move(sourceId: string, targetId: string) {
    if (sourceId === targetId || pending || saving) return;
    setSaved((current) => {
      const source = current.findIndex(({ id }) => id === sourceId);
      const target = current.findIndex(({ id }) => id === targetId);
      if (source < 0 || target < 0) return current;
      const next = [...current];
      next.splice(target, 0, next.splice(source, 1)[0]);
      return next;
    });
    setSaveMessage("");
    setSaveError("");
  }

  async function save() {
    if (saving || pending || !saved.length) return;
    setSaving(true);
    setSaveMessage("");
    setSaveError("");
    try {
      if (!previewOnly) {
        const result = await saveMediaMetadata(productId,
          saved.map(({ id, alt, role }) => ({ id, alt, role })),
          saved.find(({ is_primary }) => is_primary)?.id ?? null);
        if (!result.ok) { setSaveError(result.error); return; }
      }
      setBaseline(saved.map((image, sort_order) => ({ ...image, sort_order })));
      setSaved((current) => current.map((image, sort_order) => ({ ...image, sort_order })));
      setSaveMessage(previewOnly ? "Демонстрация сохранения завершена — данные не записаны." : "Изменения изображений сохранены.");
    } catch {
      setSaveError("Не удалось сохранить изображения. Обновите страницу и повторите попытку.");
    } finally { setSaving(false); }
  }

  const edited = (items: ImagePreview[]) => items.map(({ id, alt, role, is_primary }) => ({ id, alt, role, is_primary }));
  const dirty = JSON.stringify(edited(saved)) !== JSON.stringify(edited(baseline));
  const hasUploadable = selected.some((item) => item.status === "ready" || item.status === "error");
  const primary = saved.find(({ is_primary }) => is_primary);
  return <section className={styles.section} aria-labelledby="media-heading">
    <div className={styles.heading}>
      <h2 id="media-heading">Изображения</h2>
      <p>JPEG, PNG, WebP или AVIF, до 12 МБ на файл. Загружайте только материалы, разрешённые к публичному показу.</p>
      {previewOnly && <p>Временный Preview образец интерфейса без записи в базу и Storage.</p>}
    </div>
    {!previewOnly && <>
    <div className={styles.field}>
      <label htmlFor="media-file">Выбрать изображения</label>
      <input id="media-file" ref={inputRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
        disabled={pending || saving} aria-describedby="media-hint" onChange={(event) => {
          chooseFiles(event.target.files);
          event.target.value = "";
        }} />
      <p id="media-hint">Можно выбрать несколько файлов. После загрузки настройте alt, роль, порядок и главное изображение.</p>
    </div>
    {selected.length > 0 && <ul className={styles.selection} aria-label="Выбранные изображения" aria-live="polite">
      {selected.map((item) => <li key={item.id} className={styles.selected}>
        {item.preview ? <Image src={item.preview} alt="Предпросмотр выбранного изображения" width={136} height={112} unoptimized />
          : <span className={styles.noPreview}>Без предпросмотра</span>}
        <div>
          <strong title={item.file.name}>{item.file.name}</strong>
          <span>{(item.file.size / 1024 / 1024).toFixed(2)} МБ</span>
          <span>{item.status === "ready" ? "Готово к загрузке" :
            item.status === "invalid" ? "Недопустимый файл" :
            item.status === "uploading" ? "Загрузка…" :
            item.status === "uploaded" ? "Загружено" : "Ошибка загрузки"}</span>
          {item.error && <span className={styles.error}>{item.error}</span>}
        </div>
        {(item.status === "ready" || item.status === "invalid") &&
          <button type="button" className={styles.remove} disabled={pending}
            aria-label={`Убрать ${item.file.name} из очереди загрузки`}
            onClick={() => removeQueued(item.id)}>Убрать</button>}
      </li>)}
    </ul>}
    <button type="button" onClick={upload} disabled={pending || saving || !hasUploadable} className={styles.upload}>
      {pending ? "Загрузка…" : "Загрузить изображения"}
    </button>
    </>}
    <div className={styles.existing}>
      <h3>Связанные изображения</h3>
      {saved.length === 0 ? <p>Изображений пока нет.</p> : <>
        <p>Главное изображение используется как основное превью товара.</p>
        <div className={styles.mainPreview}>
          {primary ? <>
            <Image src={primary.url} width={160} height={116}
              alt={primary.alt || "Главное изображение без alt-текста"} unoptimized />
            <span>Основное превью товара</span>
          </> : <span>Главное изображение не выбрано.</span>}
        </div>
        <p id="media-reorder-hint">Перетаскивайте за «Переместить» или используйте кнопки «Назад» и «Вперёд». Затем сохраните изменения.</p>
        <ul className={styles.mediaGrid}>
          {saved.map((image, index) => <li key={image.id} className={styles.mediaCard}
            onDragOver={(event) => { if (dragging.current) event.preventDefault(); }}
            onDrop={(event) => { event.preventDefault(); const source = dragging.current; dragging.current = null; if (source) move(source, image.id); }}>
            <div className={styles.mediaTop}><span>Позиция {index + 1}</span>{image.is_primary && <strong>Главное</strong>}</div>
            <Image src={image.url} width={image.width} height={image.height}
              alt={image.alt || "Изображение товара без alt-текста"} loading="lazy" unoptimized draggable={false} />
            <div className={styles.reorder}>
              <button type="button" draggable={!pending && !saving} className={styles.drag}
                aria-label={`Перетащить изображение с позиции ${index + 1}`}
                aria-describedby="media-reorder-hint"
                onDragStart={(event) => { dragging.current = image.id; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", image.id); }}
                onDragEnd={() => { dragging.current = null; }}>⋮⋮ Переместить</button>
              <button type="button" disabled={index === 0 || pending || saving}
                aria-label={`Переместить изображение ${index + 1} назад`}
                onClick={() => move(image.id, saved[index - 1].id)}>Назад</button>
              <button type="button" disabled={index === saved.length - 1 || pending || saving}
                aria-label={`Переместить изображение ${index + 1} вперёд`}
                onClick={() => move(image.id, saved[index + 1].id)}>Вперёд</button>
            </div>
            <label htmlFor={`media-role-${image.id}`}>Роль</label>
            <select id={`media-role-${image.id}`} value={image.role ?? ""}
              disabled={pending || saving}
              onChange={(event) => editImage(image.id, { role: (event.target.value || null) as ImageRole | null })}>
              <option value="">Роль не задана</option>
              {IMAGE_ROLES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
            <label htmlFor={`media-alt-${image.id}`}>Alt-текст</label>
            <input id={`media-alt-${image.id}`} value={image.alt ?? ""} maxLength={250}
              disabled={pending || saving} placeholder="Опишите изображение"
              onChange={(event) => editImage(image.id, { alt: event.target.value })} />
            <button type="button" className={styles.primary} disabled={image.is_primary || pending || saving}
              onClick={() => {
                setSaved((current) => current.map((entry) => ({ ...entry, is_primary: entry.id === image.id })));
                setSaveMessage(""); setSaveError("");
              }}>{image.is_primary ? "Главное изображение" : "Сделать главным"}</button>
          </li>)}
        </ul>
        {dirty && <p className={styles.unsaved}>Есть несохранённые изменения изображений.</p>}
        <button type="button" className={styles.upload} disabled={!dirty || pending || saving} onClick={save}>
          {saving ? "Сохраняем…" : "Сохранить изображения"}
        </button>
        {saveMessage && <p className={styles.success} role="status">{saveMessage}</p>}
        {saveError && <p className={styles.error} role="alert">{saveError}</p>}
      </>}
    </div>
  </section>;
}
