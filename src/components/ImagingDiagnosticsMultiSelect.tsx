import React, { useCallback } from "react";
import SmartMultiSelect from "./SmartMultiSelect";
import { searchImagingDiagnosticsAction, getImagingDiagnosticsByIdsAction } from "@/actions/clinics/clinical-record/optimized-diagnostics.action";

interface ImagingDiagnostic {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  isActive: boolean;
}

interface ImagingDiagnosticsMultiSelectProps {
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxDisplayItems?: number;
  searchPlaceholder?: string;
  minSearchLength?: number;
}

export default function ImagingDiagnosticsMultiSelect(props: ImagingDiagnosticsMultiSelectProps) {
  const searchDiagnostics = useCallback(async (query: string): Promise<ImagingDiagnostic[]> => {
    const result = await searchImagingDiagnosticsAction(query, 50);
    return result.data || [];
  }, []);

  const fetchByIds = useCallback(async (ids: number[]): Promise<ImagingDiagnostic[]> => {
    const result = await getImagingDiagnosticsByIdsAction(ids);
    return result.data || [];
  }, []);

  const getId = useCallback((item: ImagingDiagnostic): number => item.id, []);

  const renderItem = useCallback((item: ImagingDiagnostic): React.ReactNode => (
    <div>
      <div className="font-medium text-sm">{item.name}</div>
      {item.description && (
        <div className="text-xs text-muted-foreground line-clamp-2">
          {item.description}
        </div>
      )}
    </div>
  ), []);

  return (
    <SmartMultiSelect<ImagingDiagnostic, number>
      {...props}
      placeholder={props.placeholder || "Select diagnostics..."}
      searchPlaceholder={props.searchPlaceholder || "Search diagnostics..."}
      search={searchDiagnostics}
      fetchByIds={fetchByIds}
      getId={getId}
      renderItem={renderItem}
    />
  );
}
