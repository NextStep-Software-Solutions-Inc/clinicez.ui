'use client';

import Each from '@components/utils/Each';
import { PatientCard } from './PatientCard';
import { useSearchParams } from 'next/navigation';

type ViewMode = 'list' | 'grid';

interface PatientListViewProps {
  patients: any[];
}

export function PatientListView({ patients }: PatientListViewProps) {
  const searchParams = useSearchParams();
  const viewMode = (searchParams?.get('view') as ViewMode) || 'list';

  const gridClasses = {
    list: 'grid grid-cols-1 gap-2',
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4',
  };

  return (
    <div className="space-y-0">
      {/* Patient List/Grid */}
      <div className={`${gridClasses[viewMode]} px-3 sm:px-4 md:px-5 py-3`}>
        <Each
          of={patients}
          fallback={<p className="text-muted-foreground text-center col-span-full">No patient record</p>}
          render={(patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              viewMode={viewMode}
            />
          )}
        />
      </div>
    </div>
  );
}
