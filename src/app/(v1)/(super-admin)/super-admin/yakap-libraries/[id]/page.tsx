import { YakapLibraryDetail } from "@/components/super-admin/YakapLibraryDetail";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "PhilHealth Yakap Library Details",
  description: "Manage data for a specific PhilHealth Yakap Lookup Table.",
};

export default async function YakapLibraryDetailPage(props: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const pageSize = typeof searchParams.pageSize === 'string' ? parseInt(searchParams.pageSize, 10) : 10;

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading library details...</div>}>
      <YakapLibraryDetail libraryId={params.id} initialPage={page || 1} initialPageSize={pageSize || 10} />
    </Suspense>
  );
}
