import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <p className={styles.eyebrow}>Marmix Flex · Dark Gold Showroom</p>
      <h1 className={styles.heading}>Типографика архитектурных поверхностей</h1>
      <p className={styles.description}>Тест Prata, Manrope и утверждённых базовых цветов. Это проверочная страница дизайн-системы.</p>
    </div>
  );
}
