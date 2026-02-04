'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type ViewMode = 'list' | 'grid';

interface PatientViewContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const PatientViewContext = createContext<PatientViewContextType | undefined>(undefined);

export function PatientViewProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  return (
    <PatientViewContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </PatientViewContext.Provider>
  );
}

export function usePatientView() {
  const context = useContext(PatientViewContext);
  if (context === undefined) {
    throw new Error('usePatientView must be used within PatientViewProvider');
  }
  return context;
}
