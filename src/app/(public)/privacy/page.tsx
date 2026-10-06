import type { Metadata } from "next";
import { LegalPending } from "../LegalPending";

export const metadata: Metadata = { title: "Политика конфиденциальности — Marmix Flex" };

export default function PrivacyPage() {
  return <LegalPending
    eyebrow="Marmix Flex / Юридический раздел"
    title="Политика конфиденциальности"
    status="Документ готовится к юридическому согласованию"
    explanation="Финальная редакция политики конфиденциальности и сведения об операторе персональных данных ещё не утверждены. Мы не публикуем неподтверждённые юридические данные до завершения согласования."
    items={[
      "Сведения об операторе персональных данных",
      "Финальная редакция политики",
      "Текст согласия для формы заявки",
      "Порядок обращений по вопросам персональных данных",
    ]}
    otherHref="/terms"
    otherLabel="Условия использования"
  />;
}
