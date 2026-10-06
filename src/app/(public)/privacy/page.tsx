import { createStaticMetadata } from "@/lib/seo/metadata";
import { LegalPending } from "../LegalPending";

export const metadata = createStaticMetadata({
  path: "/privacy",
  title: "Политика конфиденциальности",
  description: "Финальная редакция политики конфиденциальности Marmix Flex и сведения об операторе персональных данных ожидают юридического согласования.",
  legalPending: true,
});

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
