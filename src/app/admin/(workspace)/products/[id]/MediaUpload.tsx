"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createAdminBrowserSupabaseClient } from "@/lib/supabase/browser-auth";
import { linkUploadedImage } from "./media-actions";
import { MEDIA_BUCKET, mediaPathFor, validateImageFile, validImageDimensions } from "./media-validation";
import styles from "./media-upload.module.css";

export type ImagePreview = { id: string; url: string; width: number; height: number };
type UploadStatus = "ready" | "invalid" | "uploading" | "uploaded" | "error";
type Selection = { id: string; file: File; preview: string | null; extension: string | null; status: UploadStatus; error?: string };

export function MediaUpload({ productId, images }: { productId: string; images: ImagePreview[] }) {
  const [selected, setSelected] = useState<Selection[]>([]);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState<ImagePreview[]>(images);
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
      setSaved((current) => [...current, { id: linked.id, url, width: dimensions!.width, height: dimensions!.height }]);
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
          setSaved((current) => [...current, { id: relation.data!.id, url, width: dimensions!.width, height: dimensions!.height }]);
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
    if (pending) return;
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

  const hasUploadable = selected.some((item) => item.status === "ready" || item.status === "error");
  return <section className={styles.section} aria-labelledby="media-heading">
    <div className={styles.heading}>
      <h2 id="media-heading">Изображения</h2>
      <p>JPEG, PNG, WebP или AVIF, до 12 МБ на файл. Загружайте только материалы, разрешённые к публичному показу.</p>
    </div>
    <div className={styles.field}>
      <label htmlFor="media-file">Выбрать изображения</label>
      <input id="media-file" ref={inputRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
        disabled={pending} aria-describedby="media-hint" onChange={(event) => {
          chooseFiles(event.target.files);
          event.target.value = "";
        }} />
      <p id="media-hint">Можно выбрать несколько файлов. Alt и роль будут настроены на следующем этапе.</p>
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
    <button type="button" onClick={upload} disabled={pending || !hasUploadable} className={styles.upload}>
      {pending ? "Загрузка…" : "Загрузить изображения"}
    </button>
    <div className={styles.existing}>
      <h3>Связанные изображения</h3>
      {saved.length === 0 ? <p>Изображений пока нет.</p> : <ul>
        {saved.map((image) => <li key={image.id}>
          <Image src={image.url} width={image.width} height={image.height} alt="Изображение товара без заполненного alt" loading="lazy" unoptimized />
          <span>Метаданные изображения ещё не заполнены</span>
        </li>)}
      </ul>}
    </div>
  </section>;
}
