'use client';

import { useState, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@components/ui/button';
import { ChevronRight, ChevronLeft, Users, Search, Loader2 } from 'lucide-react';
import { PatientListView } from './PatientListView';
import { getClinicPatientsAction, type GetClinicPatientsResult } from '@/actions/clinics/clinic-patient.action';
import EMRPreviewSheetWrapper from '@components/EMRPreviewSheetWrapper';

interface PatientsContainerProps {
  clinicUid: string;
  pageSize: number;
}

export function PatientsContainer({ clinicUid, pageSize }: PatientsContainerProps) {
  const searchParams = useSearchParams();
  const search = searchParams?.get('search') || '';
  const cursor = searchParams?.get('cursor') || '';
  const view = searchParams?.get('view') || 'list';
  const gender = searchParams?.get('gender') || '';
  const minAge = parseInt(searchParams?.get('minAge') || '0');
  const maxAge = parseInt(searchParams?.get('maxAge') || '120');

  const [data, setData] = useState<GetClinicPatientsResult['data']>([]);
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
        gender: gender || undefined,
        minAge: minAge || undefined,
        maxAge: maxAge || undefined,
      });
      
      setData(result.data || []);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
      setIsLoading(false);
    };

    fetchData();
  }, [clinicUid, search, cursor, pageSize, gender, minAge, maxAge]);

  const handleNext = async () => {
    if (!nextCursor) return;
    
    startTransition(async () => {
      const result = await getClinicPatientsAction({
        clinicUid,
        search,
        cursor: nextCursor,
        pageSize: 50,
        gender: gender || undefined,
        minAge: minAge || undefined,
        maxAge: maxAge || undefined,
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
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="relative mb-6">
            <Users className="h-16 w-16 text-muted-foreground/30 animate-pulse" />
            <Search className="absolute -bottom-2 -right-2 h-8 w-8 text-muted-foreground/20 animate-bounce" style={{ animationDelay: '0.5s' }} />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">No patients found</h3>
          <p className="text-sm text-muted-foreground/70">{search ? 'Try adjusting your search criteria' : 'Get started by adding your first patient'}</p>
        </div>
        <EMRPreviewSheetWrapper />
      </>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Loading Overlay */}
      {(isLoading || isPending) && (
        <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-medium text-muted-foreground">Loading patients...</p>
          </div>
        </div>
      )}
      
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
