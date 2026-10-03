import { TechnicalCartReview } from "./TechnicalCartReview";
import { getPublishedProduct } from "@/lib/catalog/queries";

export default async function Page() {
  const azur = await getPublishedProduct("azur");
  return <TechnicalCartReview realAzurId={azur?.id ?? null} />;
}
