import { Skeleton } from "@/components/ui/skeleton";

interface PaginationSkeletonProps {
  pageCount?: number;
}

const DEFAULT_PAGE_COUNT = 3;

export default function PaginationSkeleton({ pageCount = DEFAULT_PAGE_COUNT }: PaginationSkeletonProps) {
  const safePageCount = Math.max(1, pageCount);

  return (
    <nav
      aria-label="Loading pagination"
      className="mx-auto flex w-full justify-center"
    >
      <ul className="flex flex-row items-center gap-1">
        <li>
          <Skeleton className="h-9 w-24 rounded-md" />
        </li>
        {Array.from({ length: safePageCount }).map((_, index) => (
          <li key={index}>
            <Skeleton className="h-9 w-9 rounded-md" />
          </li>
        ))}
        <li>
          <Skeleton className="h-9 w-20 rounded-md" />
        </li>
      </ul>
    </nav>
  );
}
