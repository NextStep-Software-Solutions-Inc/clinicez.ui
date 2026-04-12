import HeaderTitle from "@/components/HeaderTitle"
import { getHPTypeCounts, getAllHPByTypeAction, type HPSortOption } from "@/actions/hp.actions"
import HPTypeListShell from "@/components/v2/hp/HPTypeListShell"
import Suspend from "@/components/Suspend"
import HeroBackground from "@/components/HeroBackground"
import HPListByType from "@/components/v2/hp/HPListByType"
import HPListByTypeFallback from "@/components/v2/hp/HPListByTypeFallback"

export const dynamic = "force-dynamic"

const header = {
  title: [{ text: "Meet our Healthcare Providers", className: "text-primary-v2" }],
  description:
    "Our Healthcare Providers are equipped with the latest technology to provide you with the best care possible.",
}

type HealthcareProvidersSearchParams = Record<string, string | string[] | undefined>;

const VALID_SORT_OPTIONS: HPSortOption[] = ["name-asc", "name-desc", "experience-asc", "experience-desc"];

function extractParamValue(params: HealthcareProvidersSearchParams, key: string) {
  const rawValue = params[key];

  if (Array.isArray(rawValue)) {
    return rawValue[0];
  }

  return rawValue;
}

function parseSortOption(raw: string | undefined): HPSortOption {
  if (raw && (VALID_SORT_OPTIONS as string[]).includes(raw)) {
    return raw as HPSortOption;
  }
  return "name-asc";
}

export default async function HealthcareProvidersPage({
  searchParams,
}: {
  searchParams?: Promise<HealthcareProvidersSearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const type = extractParamValue(resolvedSearchParams, "type");
  const pageParam = extractParamValue(resolvedSearchParams, "page");
  const searchParam = extractParamValue(resolvedSearchParams, "search") ?? "";
  const sortParam = extractParamValue(resolvedSearchParams, "sort");

  const normalizedType = type?.trim();

  if (normalizedType) {
    const parsedPage = pageParam ? Number.parseInt(pageParam, 10) : NaN;
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const normalizedSearch = searchParam.trim();
    const sort = parseSortOption(sortParam);
    return (
      <div className="container mx-auto py-8 space-y-8">
        <HeroBackground imagePath="/assets/hero-v2-1.png" opacity={0.2} />
        <HeaderTitle header={header.title} description={header.description} className="text-center" />
        <Suspend loadingFallback={<HPListByTypeFallback hpTypeName={normalizedType} initialSearch={normalizedSearch} />}>
          <HPListByTypeSection hpTypeName={normalizedType} page={page} search={normalizedSearch} sort={sort} />
        </Suspend>
      </div>
    );
  }

  const hpFields = await getHPTypeCounts();

  return (
    <div className="container mx-auto px-8 py-8 space-y-8 max-w-7xl">
      <HeroBackground imagePath="/assets/hero-v2-1.png" opacity={0.2} />
      <HeaderTitle header={header.title} description={header.description} className="text-center" />
      <div className="container mx-auto px-8 py-8 max-w-7xl space-y-8">
        <Suspend>
          <HPTypeListShell data={hpFields} />
        </Suspend>
      </div>
    </div>
  );
}

async function HPListByTypeSection({
  hpTypeName,
  page,
  search,
  sort,
}: {
  hpTypeName: string;
  page: number;
  search: string;
  sort: HPSortOption;
}) {
  const hps = await getAllHPByTypeAction(hpTypeName, page, undefined, search, sort);
  const resolvedTypeName = hps.hpType?.name ?? hpTypeName;
  const canonicalTypeName = resolvedTypeName.trim();
  const hasResultsOrType = Boolean(hps.hpType);
  const displayTypeName = canonicalTypeName || hpTypeName;

  if (!hasResultsOrType && hps.items.length === 0) {
    return (
      <div className="space-y-8">
        <p className="text-center text-sm text-muted-foreground sm:text-base">
          We could not find a healthcare provider type named {displayTypeName}.
        </p>
      </div>
    );
  }

  return (
    <HPListByType
      data={hps}
      hpTypeName={displayTypeName}
      initialSearch={search}
    />
  );
}
