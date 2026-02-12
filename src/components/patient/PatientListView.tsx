'use client';

import Each from '@components/utils/Each';
import { PatientCard } from './PatientCard';
import { GetClinicPatients } from '@/actions/clinics/clinic-patient.action';

type ViewMode = 'list' | 'grid';

interface PatientListViewProps {
  patients: NonNullable<GetClinicPatients['data']>;
  viewMode?: ViewMode;
  clinicUid?: string;
}

export function PatientListView({ patients, viewMode = 'list', clinicUid }: PatientListViewProps) {

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
              clinicUid={clinicUid}
            />
          )}
        />
      </div>
    </div>
  );
}
