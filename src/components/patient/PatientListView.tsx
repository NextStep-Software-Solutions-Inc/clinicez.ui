'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import Each from '@components/utils/Each';
import { PatientCard } from './PatientCard';
import { GetClinicPatients } from '@/actions/clinics/clinic-patient.action';

type ViewMode = 'list' | 'grid';

interface PatientListViewProps {
  patients: NonNullable<GetClinicPatients['data']>;
}

export function PatientListView({ patients }: PatientListViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const gridClasses = {
    list: 'grid grid-cols-1 gap-2',
    grid: 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4',
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex gap-2 items-center justify-end px-5">
        <span className="text-xs text-muted-foreground mr-2">View:</span>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            onClick={() => setViewMode('list')}
            className="h-8 w-8 p-0"
            title="List View"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            onClick={() => setViewMode('grid')}
            className="h-8 w-8 p-0"
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Patient List/Grid */}
      <div className={`${gridClasses[viewMode]} p-5`}>
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
