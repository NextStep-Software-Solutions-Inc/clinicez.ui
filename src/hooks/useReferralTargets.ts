import { useHPs } from "@/hooks/useHP";
import { useClinics } from "@/hooks/useClinic";
import { SearchableDropdownGroup } from "@/components/ui/grouped-searchable-dropdown";
import React from "react";
import { formatHealthcareProviderName } from "@/lib/utils/format-healthcare-provider-name";

interface HealthcareProvider {
  id: number;
  HPType?: {
    id: number;
    name: string;
  };
  User: {
    userId: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface Clinic {
  id: number;
  name: string;
  description?: string | null;
  ClinicOrganizations?: Array<{
    Organization: {
      name: string;
    };
  }>;
  Tenant?: {
    name: string;
  };
}

interface ReferralTargetOption {
  value: string;
  label: string;
  type: 'clinic' | 'healthcare_provider';
  data: HealthcareProvider | Clinic;
  specialty?: string;
  description?: string;
}

export interface ReferralTarget {
  value: string;
  label: string;
  type: 'clinic' | 'healthcare_provider';
  data: HealthcareProvider | Clinic;
}

export const useReferralTargets = (clinicUid?: string) => {
  const { data: hps, isLoading: hpsLoading } = useHPs({ clinicUid });
  const { data: clinicsData, isLoading: clinicsLoading } = useClinics({ isPublic: true });

  const groups: SearchableDropdownGroup[] = React.useMemo(() => {
    const result: SearchableDropdownGroup[] = [];

    // Healthcare Providers grouped by type
    if (hps) {
      const hpsByType = hps.reduce((acc, hp) => {
        const typeName = hp.HPType?.name || 'Other';
        if (!acc[typeName]) {
          acc[typeName] = [];
        }

        const fullName = formatHealthcareProviderName({ user: hp.User });

        acc[typeName].push({
          value: `hp_${hp.id}`,
          label: fullName,
          type: 'healthcare_provider' as const,
          data: hp,
          specialty: hp.HPType?.name,
        });
        return acc;
      }, {} as Record<string, ReferralTargetOption[]>);

      Object.entries(hpsByType).forEach(([typeName, providers]) => {
        result.push({
          title: `${typeName}`,
          options: providers,
        });
      });
    }

    // Clinics grouped by organization
    if (clinicsData?.data) {
      const clinicsByOrg = clinicsData.data.reduce((acc, clinic) => {
        // Group by organization if available, otherwise by tenant
        let orgName = 'Independent Clinics';

        if (clinic.ClinicOrganizations && clinic.ClinicOrganizations.length > 0) {
          orgName = clinic.ClinicOrganizations[0].Organization.name;
        } else if (clinic.Tenant) {
          orgName = clinic.Tenant.name;
        }

        if (!acc[orgName]) {
          acc[orgName] = [];
        }
        acc[orgName].push({
          value: `clinic_${clinic.id}`,
          label: clinic.name,
          type: 'clinic' as const,
          data: clinic,
          description: clinic.description || undefined,
        });
        return acc;
      }, {} as Record<string, ReferralTargetOption[]>);

      Object.entries(clinicsByOrg).forEach(([orgName, clinics]) => {
        result.push({
          title: `${orgName}`,
          options: clinics,
        });
      });
    }

    return result;
  }, [hps, clinicsData]);

  return {
    groups,
    isLoading: hpsLoading || clinicsLoading,
  };
};
