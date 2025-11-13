import SkeletonCard from "@/components/SkeletonCard";
import { Skeleton } from "@/components/ui/skeleton";
import PaginationSkeleton from "@/components/v2/pagination/PaginationSkeleton";

interface HPListSkeletonProps {
  cards?: number;
  showControls?: boolean;
  showPagination?: boolean;
}

const DEFAULT_CARD_COUNT = 9;

export default function HPListSkeleton({
  cards = DEFAULT_CARD_COUNT,
  showControls = true,
  showPagination = true,
}: HPListSkeletonProps) {
  const count = Math.max(1, cards);

  return (
    <div className="space-y-8">
      {showControls ? (
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <Skeleton className="h-10 w-full rounded-lg" />
            <div className="flex items-center gap-2 sm:w-auto">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>

      {showPagination ? <PaginationSkeleton /> : null}
    </div>
  );
}
