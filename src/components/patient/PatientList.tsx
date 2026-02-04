import dynamic from "next/dynamic";
import { PatientListView } from "./PatientListView";
import { getClinicPatientsAction, GetClinicPatientsResult } from "@/actions/clinics/clinic-patient.action";
import EMRPreviewSheetWrapper from "@components/EMRPreviewSheetWrapper";
import { Button } from "@components/ui/button";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface PatientListProps {
  clinicUid: string
  search?: string
  cursor?: string
}

export const PatientList = async ({ clinicUid, search, cursor }: PatientListProps) => {
  const pageSize = 50;
  const cursorNumber = cursor ? parseInt(cursor) : undefined;
  const result = await getClinicPatientsAction({ clinicUid, search, cursor: cursorNumber, pageSize });
  
  if (!result.data || result.data.length === 0) {
    return (
      <>
        <div className="text-center text-muted-foreground">No patients found</div>
        <EMRPreviewSheetWrapper />
      </>
    );
  }

  const { data, nextCursor, hasMore } = result;

  return (
    <>
      <div className="pt-0">
        <PatientListView patients={data ?? []} />
      </div>

      {/* Cursor-based Pagination */}
      <div className="mb-5 mx-5 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {data?.length || 0} patients
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!cursor}
            asChild={!!cursor}
          >
            {cursor ? (
              <Link href={`?search=${search || ''}`}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            asChild={hasMore && !!nextCursor}
          >
            {hasMore && nextCursor ? (
              <Link href={`?cursor=${String(nextCursor)}&search=${search || ''}`}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
      <EMRPreviewSheetWrapper />
    </>
  );
};