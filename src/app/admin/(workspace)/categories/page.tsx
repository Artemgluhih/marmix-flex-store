import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/admin/require-admin";
import { CategoryForm } from "./CategoryForm";
import { PublicationControl } from "./PublicationControl";
import { DeleteCategoryControl } from "./DeleteCategoryControl";
import { categoryValuesFromRow, validCategoryId } from "./category-validation";
import styles from "./categories.module.css";

export const metadata: Metadata = { title: "Категории — Marmix Flex", robots: { index: false, follow: false } };

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ edit?: string; saved?: string; notice?: string; deleted?: string }> }) {
  const { supabase } = await requireAdmin("/admin/categories");
  const params = await searchParams;
  const result = await supabase.from("categories")
    .select("id,name,slug,description,sort_order,is_published,seo_title,seo_description")
    .order("sort_order", { ascending: true }).order("name", { ascending: true });
  if (result.error) throw new Error("Не удалось загрузить категории.");
  const categories = result.data ?? [];
  const systemCount = await supabase.from("products").select("id", { count: "exact", head: true }).eq("catalog_kind", "REAL");
  if (systemCount.error || systemCount.count === null) throw new Error("Не удалось подсчитать товары.");
  const selected = validCategoryId(params.edit ?? "") ? categories.find(({ id }) => id === params.edit) : undefined;
  const missing = Boolean(params.edit && !selected);
  const selectedValues = selected ? categoryValuesFromRow(selected) : undefined;
  const affected = selected ? await supabase.from("product_categories")
    .select("product_id,products!inner()", { count: "exact", head: true })
    .eq("category_id", selected.id).eq("products.catalog_kind", "REAL")
    .eq("products.is_published", true).is("products.archived_at", null) : null;
  if (affected?.error) throw new Error("Не удалось подсчитать товары категории.");
  const affectedCount = affected?.count ?? 0;
  const linked = selected ? await supabase.from("product_categories")
    .select("product_id", { count: "exact", head: true }).eq("category_id", selected.id) : null;
  if (linked?.error) throw new Error("Не удалось подсчитать связи категории.");

  return <div className={styles.page}>
    <header className={styles.heading}>
      <p className={styles.eyebrow}>Рабочее пространство / Каталог</p>
      <h1>Категории</h1>
      <p>Названия, адреса и порядок категорий каталога.</p>
    </header>
    {params.saved === "1" && <p className={styles.success} role="status">Категория сохранена.</p>}
    {params.deleted === "1" && <p className={styles.success} role="status">Категория удалена. Товары сохранены.</p>}
    {params.notice === "stale" && <p className={styles.formError} role="alert">Состояние категории изменилось. Обновите страницу и повторите действие.</p>}
    <div className={styles.layout}>
      <section className={styles.listSection} aria-labelledby="categories-list-title">
        <div className={styles.listHeader}><h2 id="categories-list-title">Список категорий</h2><Link href="/admin/categories">Добавить категорию</Link></div>
        {categories.length === 0 && <div className={styles.empty}><h3>Категории пока не добавлены</h3><p>Создайте первую пользовательскую категорию в форме рядом со списком.</p></div>}
        <div className={styles.tableFrame}><table className={styles.table}>
            <thead><tr><th scope="col">Название</th><th scope="col">Slug</th><th scope="col">Статус</th><th scope="col">Порядок</th><th scope="col">Действие</th></tr></thead>
            <tbody><tr>
              <td data-label="Название" className={styles.name}>Все товары <span className={styles.systemBadge}>Системная</span><span className={styles.systemCount}>Товаров: {systemCount.count}</span></td>
              <td data-label="Slug" className={styles.slug}>/catalog</td>
              <td data-label="Статус">Постоянно</td>
              <td data-label="Порядок">—</td>
              <td data-label="Действие">Недоступно для изменения</td>
            </tr>{categories.map((category) => <tr key={category.id}>
              <td data-label="Название" className={styles.name}>{category.name}</td>
              <td data-label="Slug" className={styles.slug}>{category.slug}</td>
              <td data-label="Статус"><span className={category.is_published ? styles.published : styles.hidden}>{category.is_published ? "Опубликована" : "Скрыта"}</span></td>
              <td data-label="Порядок">{category.sort_order}</td>
              <td data-label="Действие"><Link aria-current={selected?.id === category.id ? "true" : undefined} href={`/admin/categories?edit=${category.id}`}>Редактировать</Link></td>
            </tr>)}</tbody>
          </table></div>
      </section>
      <section className={styles.editorSection} aria-label="Форма категории">
        {missing && <p className={styles.formError} role="alert">Категория не найдена. Можно создать новую или выбрать из списка.</p>}
        <CategoryForm key={selected?.id ?? "new"} categoryId={selected?.id ?? null}
          values={selectedValues} published={selected?.is_published ?? false} />
        {selected && <PublicationControl id={selected.id} name={selected.name} published={selected.is_published}
          affectedCount={affectedCount} />}
        {selected && <DeleteCategoryControl id={selected.id} name={selected.name} published={selected.is_published}
          linkedCount={linked?.count ?? 0} />}
      </section>
    </div>
  </div>;
}
