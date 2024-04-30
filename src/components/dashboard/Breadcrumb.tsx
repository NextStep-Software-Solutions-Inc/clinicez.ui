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
          render={(segment, index) =>  (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="capitalize">
                  {
                    index !== pathSegment.length -1 ?
                      <Link href="#" >{segment}</Link> :
                      <BreadcrumbPage>{segment}</BreadcrumbPage>
                  }
                </BreadcrumbLink>
              </BreadcrumbItem>
              {index !== pathSegment.length-1 && <BreadcrumbSeparator />}
            </>
          )}
        />
      </BreadcrumbList>
    </ChadBreadcrumb>
  );
}
