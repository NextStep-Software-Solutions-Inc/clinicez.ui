"use client";

import React, { useCallback, useState } from "react";
import SmartMultiSelect from "./SmartMultiSelect";
import {
    searchImagingDiagnosticsAction,
    getImagingDiagnosticsByIdsAction
} from "@/actions/clinics/clinical-record/optimized-diagnostics.action";
import { toast } from "sonner";

interface ImagingDiagnostic {
    id: number;
    name: string;
    description: string | null;
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

export default function ImagingDiagnosticsMultiSelect({
    value,
    onChange,
    placeholder = "Select imaging diagnostics...",
    disabled = false,
    maxDisplayItems = 5,
    searchPlaceholder = "Search diagnostics...",
    minSearchLength = 1,
}: ImagingDiagnosticsMultiSelectProps) {
    const handleSearch = useCallback(
        async (searchTerm: string) => {
            if (!searchTerm || searchTerm.length < minSearchLength) {
                return [];
            }

            try {
                const result = await searchImagingDiagnosticsAction(searchTerm, 50);

                if (!result.status) {
                    toast.error(result.message || "Failed to search diagnostics");
                    return [];
                }

                return (result.data || []).map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                }));
            } catch (error) {
                console.error("Error searching diagnostics:", error);
                toast.error("Failed to search diagnostics");
                return [];
            }
        },
        [minSearchLength]
    );

    const handleGetByIds = useCallback(
        async (ids: number[]) => {
            if (!ids.length) return [];

            try {
                const result = await getImagingDiagnosticsByIdsAction(ids);

                if (!result.status) {
                    toast.error(result.message || "Failed to load diagnostics");
                    return [];
                }

                return (result.data || []).map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                }));
            } catch (error) {
                console.error("Error loading diagnostics:", error);
                toast.error("Failed to load diagnostics");
                return [];
            }
        },
        []
    );

    return (
        <SmartMultiSelect
            value={value}
            onChange={onChange}
            search={handleSearch}
            fetchByIds={handleGetByIds}
            getId={(item: ImagingDiagnostic) => item.id}
            renderItem={(item: ImagingDiagnostic) => (
                <div className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    {item.description && (
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                    )}
                </div>
            )}
            placeholder={placeholder}
            disabled={disabled}
            maxDisplayItems={maxDisplayItems}
            searchPlaceholder={searchPlaceholder}
            minSearchLength={minSearchLength}
        />
    );
}
