"use client";

import { Breadcrumb as ChadBreadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@components/ui/breadcrumb";
import Each from "@components/utils/Each";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumb() {
  const pathname = usePathname();
  const pathSegment = pathname.split("/").filter(Boolean);
  
  return (
    <ChadBreadcrumb className="hidden md:flex">
      <BreadcrumbList>
        <Each
          of={pathSegment}
          render={(segment, index) =>  {
            const decodedSegment = decodeURIComponent(segment)//.replace(/-/g, " ");
            return (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild className="">
                    {
                      index !== pathSegment.length -1 ?
                        <Link href="#" legacyBehavior>{decodedSegment}</Link> :
                        <BreadcrumbPage>{decodedSegment}</BreadcrumbPage>
                    }
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {index !== pathSegment.length-1 && <BreadcrumbSeparator />}
              </>
            );
          }}
        />
      </BreadcrumbList>
    </ChadBreadcrumb>
  );
}
