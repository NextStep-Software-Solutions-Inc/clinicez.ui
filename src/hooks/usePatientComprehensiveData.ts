'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { updateUrlParam } from '@/lib/url-utils';

export interface ComprehensivePatientData {
    // Demographics
    firstName?: string;
    lastName?: string;
    middleName?: string;
    age?: number;
    gender?: string;
    dob?: string;
    bloodType?: string;
    email?: string;
    picture?: string;
    caseNumber?: string;

    // Current Health Status
    appointments: number;
    conditions: string[];
    medications: string[];

    // Detailed Health Information
    disabilities: Array<{
        name: string;
        severity: string;
        notes?: string;
        isManaged?: boolean;
    }>;

    // Medical History
    medicalHistory: Array<{
        condition: string;
        details?: string;
    }>;

    // Family History
    familyMedicalHistory: Array<{
        condition: string;
        details?: string;
    }>;

    // Active Health Conditions
    healthConditions: Array<{
        name: string;
        severity: string;
        dateDiagnosed?: string;
        dateResolved?: string;
        status?: string;
        notes?: string;
    }>;

    // Medications Details
    medicationDetails: Array<{
        name: string;
        dosage?: string;
        frequency?: string;
        duration?: number;
        notes?: string;
    }>;

    // Vaccinations
    vaccinations: Array<{
        vaccine: string;
        dose: string;
        dateGiven: string;
        notes?: string;
    }>;

    // Recent Visits
    recentVisits: Array<{
        date: string;
        reason: string;
        complaint?: string;
    }>;

    // Vital Signs Trends
    vitalsTrends: {
        bloodPressure?: string[];
        heartRate?: number[];
        temperature?: number[];
        weight?: number[];
        respiratoryRate?: number[];
    };

    // Clinical Documentation (NEW)
    consultationNotes?: Array<{
        section: string;
        content: string;
        hpName?: string;
        createdAt: string;
        showOnPatient?: boolean;
    }>;

    preAssessmentNotes?: Array<{
        assessment: string;
        homeInstructions?: string;
        remarks: string;
        createdAt: string;
    }>;

    interventions?: Array<{
        action: string;
        details: string;
        hpName?: string;
        createdAt: string;
    }>;

    prescriptions?: Array<{
        medicines: Array<{
            name: string;
            dosage?: string;
            frequency?: string;
            duration?: number;
            notes?: string;
        }>;
        prescribedBy?: string;
        createdAt: string;
    }>;

    surgicalHistories?: Array<{
        operationName: string;
        operationDate?: string;
        notes?: string;
    }>;

    allergies?: Array<{
        allergen: string;
        reaction: string;
        notes?: string;
    }>;

    procedureUsageHistories?: Array<{
        procedureType: string;
        procedureName: string;
        usedAt: string;
    }>;

    // Summary Counts
    totalConsultationNotes?: number;
    totalPreAssessments?: number;
    totalInterventions?: number;
    totalPrescriptions?: number;
    totalSurgeries?: number;
    totalAllergies?: number;
    totalVaccinations?: number;
    totalVitals?: number;

    // Additional Info
    immunocompromised?: boolean;
    notes?: string;
}

interface UsePatientComprehensiveDataOptions {
    userId?: number;
    clinicId?: number;
    patientId?: number;
    cursor?: string;
    enabled?: boolean;
}

export const usePatientComprehensiveData = (
    options: UsePatientComprehensiveDataOptions = {}
) => {
    const { userId, clinicId, patientId, cursor, enabled = true } = options;
    const searchParams = useSearchParams();
    const [data, setData] = useState<ComprehensivePatientData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get cursor from URL if available
    const urlCursor = searchParams.get('cursor');
    const effectiveCursor = cursor || urlCursor;

    useEffect(() => {
        if (!enabled || !userId) return;

        const fetchPatientData = async () => {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams();
                if (clinicId) params.append('clinicId', clinicId.toString());
                if (effectiveCursor) params.append('cursor', effectiveCursor);

                const response = await fetch(
                    `/api/patients/${userId}/data?${params.toString()}`
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch patient data: ${response.status}`);
                }

                const patientData: ComprehensivePatientData = await response.json();
                setData(patientData);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(errorMessage);
                console.error('Error fetching comprehensive patient data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPatientData();
    }, [userId, clinicId, effectiveCursor, enabled]);

    const updateUrlCursor = (newCursor: string) => {
        updateUrlParam('cursor', newCursor);
    };

    return {
        data,
        loading,
        error,
        refetch: async () => {
            if (!userId) return null;
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (clinicId) params.append('clinicId', clinicId.toString());
                if (effectiveCursor) params.append('cursor', effectiveCursor);

                const response = await fetch(
                    `/api/patients/${userId}/data?${params.toString()}`
                );
                if (response.ok) {
                    const patientData = await response.json();
                    setData(patientData);
                    return patientData;
                }
                return null;
            } catch (err) {
                console.error('Error refetching patient data:', err);
                return null;
            } finally {
                setLoading(false);
            }
        },
        updateCursor: updateUrlCursor,
    };
};
