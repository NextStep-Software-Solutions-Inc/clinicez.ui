'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, Search, Loader2 } from 'lucide-react';
import { PatientListView } from './PatientListView';
import { getClinicPatientsAction, type GetClinicPatientsResult } from '@/actions/clinics/clinic-patient.action';
import EMRPreviewSheetWrapper from '@components/EMRPreviewSheetWrapper';
import PatientsHeader from './PatientsHeader';

interface PatientsContainerProps {
  clinicUid: string;
  pageSize: number;
}

export function PatientsContainer({ clinicUid, pageSize }: PatientsContainerProps) {
  const searchParams = useSearchParams();
  const search = searchParams?.get('search') || '';
  const view = (searchParams?.get('view') as 'list' | 'grid') || 'list';
  const gender = searchParams?.get('gender') || '';
  const minAge = parseInt(searchParams?.get('minAge') || '0');
  const maxAge = parseInt(searchParams?.get('maxAge') || '120');

  const [allData, setAllData] = useState<GetClinicPatientsResult['data']>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch initial data when search/filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getClinicPatientsAction({
          clinicUid,
          search,
          cursor: undefined,
          pageSize,
          gender: gender || undefined,
          minAge: minAge || undefined,
          maxAge: maxAge || undefined,
        });
        
        setAllData(result.data || []);
        setNextCursor(result.nextCursor);
        setHasMore(result.hasMore);
        setTotalCount(result.total || 0);
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [clinicUid, search, pageSize, gender, minAge, maxAge]);

  const handleLoadMore = () => {
    if (!nextCursor || isPending) return;
    
    startTransition(async () => {
      try {
        const result = await getClinicPatientsAction({
          clinicUid,
          search,
          cursor: nextCursor,
          pageSize,
          gender: gender || undefined,
          minAge: minAge || undefined,
          maxAge: maxAge || undefined,
        });
        
        // Append new data to existing list (infinite scroll)
        setAllData(prev => [...prev, ...(result.data || [])]);
        setNextCursor(result.nextCursor);
        setHasMore(result.hasMore);
      } catch (error) {
        console.error('Failed to load more patients:', error);
      }
    });
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isPending) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, isPending, clinicUid, search, gender, minAge, maxAge, pageSize]);

  return (
    <div className="flex flex-col h-full">
      <PatientsHeader clinicUid={clinicUid} patientCount={allData.length} totalPatients={totalCount} />
      
      {isLoading ? (
        <LoadingState />
      ) : allData.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <>
          <PatientListView patients={allData} viewMode={view} />
          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={observerTarget} className="flex justify-center items-center py-8">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <p className="text-xs text-muted-foreground">Loading more patients...</p>
              </div>
            </div>
          )}

          {/* End of list message */}
          {!hasMore && allData.length > 0 && (
            <div className="flex justify-center items-center py-8">
              <p className="text-xs text-muted-foreground">No more patients to load</p>
            </div>
          )}
        </>
      )}
      <EMRPreviewSheetWrapper />
    </div>
  );
}

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
    <p className="text-sm font-medium text-muted-foreground">Loading patients...</p>
  </div>
);

const EmptyState = ({ search }: { search: string }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="relative mb-6">
      <Users className="h-16 w-16 text-muted-foreground/30 animate-pulse" />
      <Search className="absolute -bottom-2 -right-2 h-8 w-8 text-muted-foreground/20 animate-bounce" style={{ animationDelay: '0.5s' }} />
    </div>
    <h3 className="text-lg font-semibold text-muted-foreground mb-2">No patients found</h3>
    <p className="text-sm text-muted-foreground/70">{search ? 'Try adjusting your search criteria' : 'Get started by adding your first patient'}</p>
  </div>
);
