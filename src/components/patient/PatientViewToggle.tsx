'use client';

import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';

interface PatientViewToggleProps {
  viewMode: 'list' | 'grid';
  onViewChange: (mode: 'list' | 'grid') => void;
}

export function PatientViewToggle({ viewMode, onViewChange }: PatientViewToggleProps) {
  return (
    <div className="flex gap-2 items-center whitespace-nowrap">
      <span className="text-xs text-muted-foreground">View:</span>
      <div className="flex gap-1 bg-muted rounded-lg p-0.5">
        <Button
          size="sm"
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          onClick={() => onViewChange('list')}
          className="h-8 w-8 p-0"
          title="List View"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          onClick={() => onViewChange('grid')}
          className="h-8 w-8 p-0"
          title="Grid View"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
