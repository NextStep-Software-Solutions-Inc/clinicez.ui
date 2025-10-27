"use client";

import SearchPaginatedList from "@/components/v2/SearchPaginatedList";

import HPListSkeleton from "./HPListSkeleton";
import { useHPListNavigation } from "./useHPListNavigation";

interface HPListByTypeFallbackProps {
  hpTypeName: string;
  initialSearch?: string;
  skeletonCount?: number;
}

const DEFAULT_SKELETON_COUNT = 9;

export default function HPListByTypeFallback({
  hpTypeName,
  initialSearch = "",
  skeletonCount = DEFAULT_SKELETON_COUNT,
}: HPListByTypeFallbackProps) {
  const sanitizedTypeName = hpTypeName.trim();
  const { activeSearch, handleSearchChange, handlePageChange, createHref } = useHPListNavigation({
    hpTypeName: sanitizedTypeName || "unknown",
    initialSearch,
  });

  if (!sanitizedTypeName) {
    return <HPListSkeleton cards={skeletonCount} showPagination />;
  }

  return (
    <SearchPaginatedList
      mode="remote"
      data={[]}
      render={() => null}
      searchValue={activeSearch}
      onSearchChange={handleSearchChange}
      isSearching
      onNavigate={handlePageChange}
      searchPlaceholder="Search healthcare providers..."
      itemsWrapperClassName="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3"
      emptyMessage=""
      loadingSlot={(
        <HPListSkeleton
          cards={skeletonCount}
          showControls={false}
          showPagination={false}
        />
      )}
      pagination={{
        page: 1,
        totalPages: 1,
        generateHref: createHref,
      }}
    />
  );
}
