import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/admin/require-admin";
import { CategoryForm } from "./CategoryForm";
import { categoryValuesFromRow, validCategoryId } from "./category-validation";
import styles from "./categories.module.css";

export const metadata: Metadata = { title: "Категории — Marmix Flex", robots: { index: false, follow: false } };

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ edit?: string; saved?: string }> }) {
  const { supabase } = await requireAdmin("/admin/categories");
  const params = await searchParams;
  const result = await supabase.from("categories")
    .select("id,name,slug,description,sort_order,is_published,seo_title,seo_description")
    .order("sort_order", { ascending: true }).order("name", { ascending: true });
  if (result.error) throw new Error("Не удалось загрузить категории.");
  const categories = result.data ?? [];
  const selected = validCategoryId(params.edit ?? "") ? categories.find(({ id }) => id === params.edit) : undefined;
  const missing = Boolean(params.edit && !selected);
  const selectedValues = selected ? categoryValuesFromRow(selected) : undefined;

  return <div className={styles.page}>
    <header className={styles.heading}>
      <p className={styles.eyebrow}>Рабочее пространство / Каталог</p>
      <h1>Категории</h1>
      <p>Названия, адреса и порядок категорий каталога.</p>
    </header>
    {params.saved === "1" && <p className={styles.success} role="status">Категория сохранена.</p>}
    <div className={styles.layout}>
      <section className={styles.listSection} aria-labelledby="categories-list-title">
        <div className={styles.listHeader}><h2 id="categories-list-title">Список категорий</h2><Link href="/admin/categories">Добавить категорию</Link></div>
        {categories.length === 0 ? <div className={styles.empty}><h3>Категории пока не добавлены</h3><p>Создайте первую категорию в форме рядом со списком.</p></div>
          : <div className={styles.tableFrame}><table className={styles.table}>
            <thead><tr><th scope="col">Название</th><th scope="col">Slug</th><th scope="col">Статус</th><th scope="col">Порядок</th><th scope="col">Действие</th></tr></thead>
            <tbody>{categories.map((category) => <tr key={category.id}>
              <td data-label="Название" className={styles.name}>{category.name}</td>
              <td data-label="Slug" className={styles.slug}>{category.slug}</td>
              <td data-label="Статус"><span className={category.is_published ? styles.published : styles.hidden}>{category.is_published ? "Опубликована" : "Скрыта"}</span></td>
              <td data-label="Порядок">{category.sort_order}</td>
              <td data-label="Действие"><Link aria-current={selected?.id === category.id ? "true" : undefined} href={`/admin/categories?edit=${category.id}`}>Редактировать</Link></td>
            </tr>)}</tbody>
          </table></div>}
      </section>
      <section className={styles.editorSection} aria-label="Форма категории">
        {missing && <p className={styles.formError} role="alert">Категория не найдена. Можно создать новую или выбрать из списка.</p>}
        <CategoryForm key={selected?.id ?? "new"} categoryId={selected?.id ?? null}
          values={selectedValues} published={selected?.is_published ?? false} />
      </section>
    </div>
  </div>;
}
