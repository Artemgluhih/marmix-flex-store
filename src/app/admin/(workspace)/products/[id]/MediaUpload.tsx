"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createAdminBrowserSupabaseClient } from "@/lib/supabase/browser-auth";
import { linkUploadedImage } from "./media-actions";
import { MEDIA_BUCKET, mediaPathFor, validateImageFile, validImageDimensions } from "./media-validation";
import styles from "./media-upload.module.css";

export type ImagePreview = { id: string; url: string; width: number; height: number };

export function MediaUpload({ productId, images, previewOnly = false }: { productId: string; images: ImagePreview[]; previewOnly?: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<ImagePreview[]>(images);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  async function upload() {
    if (pending) return;
    setError(""); setMessage("");
    if (!file) { setError("Сначала выберите изображение."); return; }
    const validation = validateImageFile(file);
    if ("error" in validation) { setError(validation.error); return; }
    if (previewOnly) {
      setPending(true);
      window.setTimeout(() => { setPending(false); setMessage("Образец завершённой загрузки — файл не записан."); }, 700);
      return;
    }
    setPending(true);
    let path: string | null = null;
    let client: ReturnType<typeof createAdminBrowserSupabaseClient> | null = null;
    let dimensions: { width: number; height: number } | null = null;
    try {
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      bitmap.close();
      if (!validImageDimensions(width, height)) { setError("Не удалось определить размеры изображения."); return; }
      dimensions = { width, height };
      client = createAdminBrowserSupabaseClient();
      const user = await client.auth.getUser();
      if (user.error || !user.data.user) { setError("Сессия истекла. Войдите в Admin повторно."); return; }
      path = mediaPathFor(productId, crypto.randomUUID(), validation.extension);
      const bucket = client.storage.from(MEDIA_BUCKET);
      const uploaded = await bucket.upload(path, file, { contentType: file.type, upsert: false });
      if (uploaded.error) { path = null; setError("Не удалось загрузить изображение. Проверьте доступ и попробуйте ещё раз."); return; }

      const linked = await linkUploadedImage(productId, path, width, height);
      if (!linked.ok) {
        const cleanup = await bucket.remove([path]);
        setError(cleanup.error ? `${linked.error} Загруженный файл не удалось очистить; сообщите администратору.` : linked.error);
        return;
      }

      const { data } = bucket.getPublicUrl(path);
      setSaved((current) => [...current, { id: path!, url: data.publicUrl, width, height }]);
      setFile(null); setPreview(null); if (inputRef.current) inputRef.current.value = "";
      setMessage("Изображение загружено и привязано к товару.");
    } catch {
      if (path && client) {
        // A lost Server Action response may follow a committed metadata insert.
        // Keep the object when its relation exists instead of creating a broken row.
        try {
          const relation = await client.from("product_images").select("id")
            .eq("product_id", productId).eq("storage_path", path).maybeSingle();
          if (relation.error) throw relation.error;
          if (relation.data) {
            const publicUrl = client.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
            const linkedId = relation.data.id;
            const measured = dimensions;
            if (measured) setSaved((current) => [...current, { id: linkedId, url: publicUrl, width: measured.width, height: measured.height }]);
            setMessage("Изображение привязано. Обновите страницу для проверки.");
            return;
          }
          const cleanup = await client.storage.from(MEDIA_BUCKET).remove([path]);
          setError(cleanup.error ? "Загрузка прервалась; файл не удалось очистить. Сообщите администратору." : "Загрузка не завершилась. Повторите попытку.");
        } catch {
          setError("Не удалось проверить результат загрузки. Обновите страницу и сообщите администратору, если изображение отсутствует.");
        }
      } else setError("Файл не удалось прочитать. Выберите исправное изображение.");
    } finally { setPending(false); }
  }

  return <section className={styles.section} aria-labelledby="media-heading">
    <div className={styles.heading}>
      <h2 id="media-heading">Изображения</h2>
      <p>JPEG, PNG, WebP или AVIF, до 12 МБ. Загружайте только материалы, разрешённые к публичному показу.</p>
      {previewOnly && <p>Демонстрация интерфейса без записи в Storage и базу данных.</p>}
    </div>
    <div className={styles.field}>
      <label htmlFor="media-file">Выбрать изображение</label>
      <input id="media-file" ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
        disabled={pending} aria-describedby={error ? "media-error" : "media-hint"}
        onChange={(event) => {
          const selected = event.target.files?.[0] ?? null;
          const validation = selected ? validateImageFile(selected) : null;
          if (validation && "error" in validation) {
            setFile(null); setPreview(null); setError(validation.error);
            event.target.value = "";
          } else {
            setFile(selected); setPreview(selected ? URL.createObjectURL(selected) : null); setError("");
          }
          setMessage("");
        }} />
      <p id="media-hint">Alt и роль будут настроены на следующем этапе.</p>
    </div>
    {file && <div className={styles.selected}>
      {preview && <Image src={preview} alt="Предпросмотр выбранного изображения" width={136} height={112} unoptimized />}
      <div><strong title={file.name}>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} МБ</span></div>
    </div>}
    <button type="button" onClick={upload} disabled={pending || !file} className={styles.upload}>
      {pending ? "Загрузка…" : "Добавить изображение"}
    </button>
    {error && <p className={styles.error} id="media-error" role="alert">{error}</p>}
    {message && <p className={styles.success} role="status">{message}</p>}
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
