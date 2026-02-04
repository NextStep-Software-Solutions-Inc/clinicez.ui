'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { PatientListView } from './PatientListView';
import { getClinicPatientsAction, GetClinicPatientsResult } from '@/actions/clinics/clinic-patient.action';
import EMRPreviewSheetWrapper from '@components/EMRPreviewSheetWrapper';

interface PatientListClientProps {
  clinicUid: string;
  search?: string;
  cursor?: string;
  pageSize: number;
}

export function PatientListClient({ clinicUid, search, cursor, pageSize }: PatientListClientProps) {
  const [data, setData] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const cursorNumber = cursor ? parseInt(cursor) : undefined;
      const result = await getClinicPatientsAction({
        clinicUid,
        search,
        cursor: cursorNumber,
        pageSize,
      });
      
      setData(result.data || []);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
      setIsLoading(false);
    };

    fetchData();
  }, [clinicUid, search, cursor, pageSize]);

  const handleNext = async () => {
    if (!nextCursor) return;
    
    startTransition(async () => {
      const result = await getClinicPatientsAction({
        clinicUid,
        search,
        cursor: nextCursor,
        pageSize: 50,
      });
      
      setData(result.data || []);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    });
  };

  const handlePrevious = () => {
    // Reset to first page
    window.location.href = `?search=${search || ''}`;
  };

  if (!data || data.length === 0) {
    return (
      <>
        <div className="text-center text-muted-foreground py-8">No patients found</div>
        <EMRPreviewSheetWrapper />
      </>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PatientListView patients={data} />

      {/* Pagination Controls */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t mt-auto px-3 sm:px-5 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
        <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
          Showing {data?.length || 0} patients
        </div>
        <div className="flex gap-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!nextCursor || isPending}
            onClick={handlePrevious}
            className="text-xs sm:text-sm"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-1">Previous</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore || isPending}
            onClick={handleNext}
            className="text-xs sm:text-sm"
          >
            <span className="hidden sm:inline mr-1">Next</span>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
      <EMRPreviewSheetWrapper />
    </div>
  );
}
