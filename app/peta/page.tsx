import { PetaScreen, type PetaInitialQuery } from "@/components/PetaScreen";
import {
  ALL_CATEGORIES,
  CATEGORIES,
  DEFAULT_SLOT,
  SLOTS,
} from "@/lib/data/dimensions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PetaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const slotValue = first(params.slot);
  const categoryValue = first(params.category);
  const stationValue = Number(first(params.station));
  const pointValue = Number(first(params.point));
  const retailFilterValue = first(params.retail_filter);
  const initialQuery: PetaInitialQuery = {
    stationId:
      Number.isFinite(stationValue) && stationValue > 0 ? stationValue : null,
    pointId: Number.isFinite(pointValue) && pointValue > 0 ? pointValue : null,
    retailId: first(params.retail) ?? null,
    rentalId: first(params.rental) ?? null,
    retailFilter: ["all", "sewa", "potensi", "existing", "ruko"].includes(
      retailFilterValue as string,
    )
      ? (retailFilterValue as PetaInitialQuery["retailFilter"])
      : undefined,
    slot: SLOTS.some((item) => item.key === slotValue)
      ? (slotValue as PetaInitialQuery["slot"])
      : DEFAULT_SLOT,
    category:
      categoryValue === ALL_CATEGORIES ||
      CATEGORIES.some((item) => item.key === categoryValue)
        ? (categoryValue as PetaInitialQuery["category"])
        : ALL_CATEGORIES,
  };
  return <PetaScreen initialQuery={initialQuery} />;
}
