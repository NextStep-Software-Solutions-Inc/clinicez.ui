import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonCardProps {
  withFooter?: boolean;
}

export default function SkeletonCard({ withFooter = true }: SkeletonCardProps) {
  return (
    <Card className="flex h-full w-full flex-col overflow-hidden transition-all duration-300 ease-out">
      <CardContent className="flex-1 p-4 sm:p-6">
        <div className="flex w-full flex-col items-center gap-6 sm:flex-row">
          <div className="flex aspect-square h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted sm:h-24 sm:w-24">
            <Skeleton className="h-full w-full" />
          </div>

          <div className="flex w-full min-w-0 flex-col items-center gap-3 sm:items-start">
            <Skeleton className="h-5 w-48 sm:w-56" />
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>

      {withFooter ? (
        <CardFooter className="flex w-full flex-col items-stretch gap-3 px-4 pb-6 pt-0 sm:flex-row sm:items-center sm:px-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      ) : null}
    </Card>
  );
}
