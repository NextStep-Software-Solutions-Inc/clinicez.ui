"use client";

import { ArrowUpDown } from "lucide-react";
import type { GetAllHPByType } from "@/actions/hp.actions";
import type { HPSortOption } from "@/lib/hp-utils";
import SearchPaginatedList from "@/components/v2/SearchPaginatedList";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { HPCard } from "./HPCard";
import HPListSkeleton from "./HPListSkeleton";
import { useHPListNavigation } from "./useHPListNavigation";

interface HPListByTypeProps {
  data: GetAllHPByType;
  hpTypeName: string;
  initialSearch?: string;
}

const SORT_LABELS: Record<HPSortOption, string> = {
  "name-asc": "Name A–Z",
  "name-desc": "Name Z–A",
  "experience-asc": "Least Experienced",
  "experience-desc": "Most Experienced",
};

export default function HPListByType({ data, hpTypeName, initialSearch = "" }: HPListByTypeProps) {
  const { items, pagination, search: normalizedSearch } = data;
  const resolvedTypeName = data.hpType?.name ?? hpTypeName;
  const canonicalTypeName = resolvedTypeName.trim();
  const fallbackTypeName = hpTypeName.trim();
  const effectiveTypeName = canonicalTypeName.length ? canonicalTypeName : fallbackTypeName;

  const { activeSearch, activeSort, handleSearchChange, handlePageChange, handleSortChange, createHref, isPending } = useHPListNavigation({
    hpTypeName: effectiveTypeName || fallbackTypeName || "unknown",
    initialSearch: normalizedSearch || initialSearch,
  });

  if (!effectiveTypeName) {
    return (
      <div className="space-y-8">
        <p className="text-center text-sm text-muted-foreground sm:text-base">
          Healthcare provider type information is unavailable.
        </p>
      </div>
    );
  }

  const skeletonCount = pagination.pageSize ?? Math.max(items.length, 6);

  const sortSlot = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="flex items-center gap-2 bg-transparent">
          <ArrowUpDown className="h-4 w-4" />
          {SORT_LABELS[activeSort]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(SORT_LABELS) as HPSortOption[]).map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => handleSortChange(option)}
            className={activeSort === option ? "font-semibold" : ""}
          >
            {SORT_LABELS[option]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <SearchPaginatedList
      mode="remote"
      data={items}
      render={(hp) => (
        <HPCard
          key={hp.id}
          hpId={hp.id}
          hp={{
            id: hp.HPProfile?.id,
            imageUrl: hp.HPProfile?.picture || undefined,
            title: hp.HPProfile?.title || undefined,
            name: hp.HPProfile?.name || "Healthcare Provider",
            suffix: hp.HPProfile?.suffix || undefined,
            type: hp.HPType?.name || undefined,
            experience: hp.HPProfile?.experience || undefined,
            educations: hp.HPProfile?.educations || undefined,
            languages: hp.HPProfile?.languages || undefined,
            philosophy: hp.HPProfile?.philosophy || undefined,
            workEmail: hp.HPProfile?.workEmail || undefined,
            workPhone: hp.HPProfile?.workPhone || undefined,
          }}
          organization={hp.User?.OrganizationMembers?.[0]?.Organization?.name || undefined}
        />
      )}
      loadingSlot={(
        <HPListSkeleton
          cards={skeletonCount}
          showControls={false}
          showPagination={false}
        />
      )}
      searchValue={activeSearch}
      onSearchChange={handleSearchChange}
      isSearching={isPending}
      onNavigate={handlePageChange}
      searchPlaceholder="Search healthcare providers..."
      itemsWrapperClassName="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3"
      emptyMessage="No healthcare providers found for this type yet."
      sortSlot={sortSlot}
      pagination={{
        page: pagination.page,
        totalPages: pagination.totalPages,
        generateHref: createHref,
      }}
    />
  );
}
