"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@components/ui/pagination"
import ConditionalRender from "./utils/ConditionalRender"
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Each from "./utils/Each";

interface PaginateProps {
    initialPage: number,
    totalPages: number
}
export default function Paginate({initialPage = 1, totalPages}:PaginateProps) {
  const searchParams = useSearchParams()
  const currentPage = searchParams.get("page") ? parseInt(searchParams.get("page") as string) : initialPage
  
  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  
  const getNextPage = useMemo(() => {
    const currentSearchParams = new URLSearchParams(searchParams.toString())
    currentSearchParams.set("page", (currentPage + 1).toString())
    return `?${currentSearchParams.toString()}`
  }, [currentPage, searchParams])

  const getPreviewsPage = useMemo(() => {
    const currentSearchParams = new URLSearchParams(searchParams.toString())
    currentSearchParams.set("page", (currentPage - 1).toString())
    return `?${currentSearchParams.toString()}`
  }, [currentPage, searchParams])

  const jumpToPage = (page: string) => {
    const currentSearchParams = new URLSearchParams(searchParams.toString())
    currentSearchParams.set("page", page)
    return `?${currentSearchParams.toString()}`
  }

  const [start, end] = currentPage > 2 ? [currentPage - 2, currentPage + 1] : [0, 3]
  return (
    <div>
      <Pagination>
        <PaginationContent>
          <ConditionalRender condition={hasPreviousPage}>
            <PaginationItem>
              <PaginationPrevious href={getPreviewsPage} />
            </PaginationItem>
          </ConditionalRender>
          <ConditionalRender condition={currentPage > 2}>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </ConditionalRender>
          <Each 
            fallback=""
            of={Array.from({length: totalPages}, (_, i) => i + 1).slice(start, end)}
            render={(page) => (
              <PaginationItem>
                <PaginationLink href={jumpToPage(page.toString())}  isActive={currentPage === page}>{page}</PaginationLink>
              </PaginationItem>
            )}
          />
          <ConditionalRender condition={currentPage < totalPages - 1}>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </ConditionalRender>
          <ConditionalRender condition={hasNextPage}>
            <PaginationItem>
              <PaginationNext href={getNextPage} />
            </PaginationItem>
          </ConditionalRender>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
  