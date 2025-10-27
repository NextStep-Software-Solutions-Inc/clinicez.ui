"use client";

import type { MouseEvent } from "react";
import { useMemo } from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@lib/utils";

interface AppPaginationProps {
  currentPage: number;
  totalPages: number;
  generateHref: (page: number) => string;
  className?: string;
  siblingCount?: number;
  hideIfSinglePage?: boolean;
  onNavigate?: (page: number) => void;
  isDisabled?: boolean;
}

type PaginationNode = number | "ellipsis-start" | "ellipsis-end";

const DEFAULT_SIBLING_COUNT = 1;

export function AppPagination({
  currentPage,
  totalPages,
  generateHref,
  className,
  siblingCount = DEFAULT_SIBLING_COUNT,
  hideIfSinglePage = true,
  onNavigate,
  isDisabled = false,
}: AppPaginationProps) {
  const sanitizedTotalPages = Math.max(0, totalPages);
  const safeCurrentPage = sanitizedTotalPages
    ? Math.min(Math.max(1, currentPage), sanitizedTotalPages)
    : 1;

  const paginationNodes = useMemo<PaginationNode[]>(() => {
    if (!sanitizedTotalPages) {
      return [];
    }

    const totalNumbersToShow = siblingCount * 2 + 5;

    if (totalNumbersToShow >= sanitizedTotalPages) {
      return Array.from({ length: sanitizedTotalPages }, (_, index) => index + 1);
    }

    const leftSiblingIndex = Math.max(safeCurrentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(safeCurrentPage + siblingCount, sanitizedTotalPages);

    const shouldShowLeftEllipsis = leftSiblingIndex > 2;
    const shouldShowRightEllipsis = rightSiblingIndex < sanitizedTotalPages - 1;

    const range: PaginationNode[] = [1];

    if (shouldShowLeftEllipsis) {
      range.push("ellipsis-start");
    }

    const startPage = shouldShowLeftEllipsis ? leftSiblingIndex : 2;
    const endPage = shouldShowRightEllipsis ? rightSiblingIndex : sanitizedTotalPages - 1;

    for (let page = startPage; page <= endPage; page += 1) {
      range.push(page);
    }

    if (shouldShowRightEllipsis) {
      range.push("ellipsis-end");
    }

    if (sanitizedTotalPages > 1) {
      range.push(sanitizedTotalPages);
    }

    return range;
  }, [sanitizedTotalPages, siblingCount, safeCurrentPage]);

  if (hideIfSinglePage && sanitizedTotalPages <= 1) {
    return null;
  }

  if (!paginationNodes.length) {
    return null;
  }

  const previousPage = Math.max(1, safeCurrentPage - 1);
  const nextPage = Math.min(sanitizedTotalPages || 1, safeCurrentPage + 1);
  const isPreviousDisabled = safeCurrentPage <= 1;
  const isNextDisabled = safeCurrentPage >= sanitizedTotalPages;

  const shouldHandleClick = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return false;
    }

    return true;
  };

  const createClickHandler = (targetPage: number) => (event: MouseEvent) => {
    if (!shouldHandleClick(event)) {
      return;
    }

    if (isDisabled || targetPage === safeCurrentPage || !onNavigate) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    onNavigate(targetPage);
  };

  return (
    <Pagination
      className={cn("w-full", className, isDisabled && "pointer-events-none opacity-60")}
      aria-disabled={isDisabled}
    >
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={generateHref(previousPage)}
            aria-disabled={isPreviousDisabled}
            className={cn(
              isPreviousDisabled && "pointer-events-none opacity-50"
            )}
            onClick={isPreviousDisabled ? undefined : createClickHandler(previousPage)}
          />
        </PaginationItem>
        {paginationNodes.map((node) => (
          <PaginationItem key={typeof node === "number" ? node : node}>
            {typeof node === "number" ? (
              <PaginationLink
                href={generateHref(node)}
                isActive={node === safeCurrentPage}
                aria-disabled={isDisabled || node === safeCurrentPage}
                className={cn(isDisabled && "pointer-events-none")}
                onClick={createClickHandler(node)}
              >
                {node}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href={generateHref(nextPage)}
            aria-disabled={isNextDisabled}
            className={cn(isNextDisabled && "pointer-events-none opacity-50")}
            onClick={isNextDisabled ? undefined : createClickHandler(nextPage)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default AppPagination;
