import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { CategoryMultiselect } from "@/components/admin/CategoryMultiselect";
import categories from "../../categories/categories.module.css";
import product from "../../products/new/new-product.module.css";

/** Temporary no-write Preview presentation. Remove after owner visual approval. */
export default async function T032AVisual() {
  if (process.env.VERCEL_ENV !== "preview") notFound();
  await requireAdmin("/admin/internal/t032a-visual");
  const names = ["TEST_ONLY Категория A", "TEST_ONLY Категория B", "TEST_ONLY Категория C"];
  const options = names.map((name, index) => ({ id: `visual-${index}`, name }));
  return <div className={categories.page}>
    <header className={categories.heading}><p className={categories.eyebrow}>TEST_ONLY / без записи в базу</p>
      <h1>Multi-category visual check</h1><p>Образец состояний интерфейса. Кнопки сохранения не выполняют действий.</p></header>
    <div className={categories.layout}>
      <section className={categories.listSection} aria-label="Список категорий">
        <div className={categories.tableFrame}><table className={categories.table}>
          <thead><tr><th>Название</th><th>Slug</th><th>Статус</th><th>Порядок</th><th>Действие</th></tr></thead>
          <tbody><tr><td data-label="Название" className={categories.name}>Все товары <span className={categories.systemBadge}>Системная</span><span className={categories.systemCount}>Товаров: 0</span></td>
            <td data-label="Slug">/catalog</td><td data-label="Статус">Постоянно</td><td data-label="Порядок">—</td><td data-label="Действие">Недоступно для изменения</td></tr>
            {names.map((name, index) => <tr key={name}><td data-label="Название" className={categories.name}>{name}</td>
              <td data-label="Slug">test-only-{index + 1}</td><td data-label="Статус">Скрыта</td><td data-label="Порядок">{index}</td><td data-label="Действие">Редактировать</td></tr>)}</tbody>
        </table></div>
        <section className={categories.publication}><h2>Товары</h2>
          <p>Один товар, связанные категории: {names.join(" · ")}.</p>
          <p>Без связей: Без пользовательских категорий.</p></section>
      </section>
      <section className={categories.editorSection} aria-label="Визуальные состояния действий">
        <section className={product.section}><div className={product.sectionHeading}><h2>Категории товара</h2><p>Создание: без выбранных категорий. Редактор: сохранены две категории. Образцы не отправляют данные.</p></div>
          <CategoryMultiselect categories={options} selectedIds={[]} />
          <CategoryMultiselect categories={options} selectedIds={[options[0].id, options[2].id]} />
        </section>
        <section className={categories.publication}><h2>Публикация категории</h2>
          <p>Опубликованных неархивных товаров в категории: <strong>0</strong>.</p>
          <details className={categories.confirmation}><summary>Снять с публикации</summary><div className={categories.confirmationBody}>
            <p>Категория исчезнет из публичного списка. Товары останутся в «Все товары», Product Detail и других опубликованных категориях.</p>
            <button type="button" disabled>Подтверждение недоступно в образце</button></div></details>
          <details className={categories.confirmation}><summary>Опубликовать</summary><div className={categories.confirmationBody}>
            <p>Опубликованные неархивные товары снова появятся в списке этой категории.</p></div></details>
        </section>
        <section className={categories.publication}><h2>Удаление категории</h2>
          <details className={categories.confirmation}><summary>Удалить категорию</summary><div className={categories.confirmationBody}>
            <p><strong>{names[0]}</strong> — связанных товаров: <strong>0</strong>.</p>
            <p>Будет удалена только категория и её связи. Сами товары останутся в «Все товары» и других категориях.</p>
            <button type="button" disabled>Подтверждение недоступно в образце</button></div></details>
        </section>
      </section>
    </div>
  </div>;
}
