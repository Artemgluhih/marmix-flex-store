import type { Metadata } from "next";
import { TechnicalCheckoutReview } from "./TechnicalCheckoutReview";

export const metadata: Metadata = { title: "Техническая проверка формы — Marmix Flex", robots: { index: false, follow: false } };
export default function ReviewPage() { return <TechnicalCheckoutReview />; }
