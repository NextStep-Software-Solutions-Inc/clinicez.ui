import { self } from "@/services/request";
import useSWR from "swr";

export type LaboratoryRequestsFilters = {
  clinicUid?: string;
  patientId?: number;
  hpId?: number;
  status?: string;
  consultationTicketId?: number;
};

export type LaboratoryRequest = {
  id: number;
  serialNumber?: string;
  createdAt: string | Date;
  status?: string;
  impression?: string;
  ClinicPatient?: {
    id: number;
    Patient?: {
      id: number;
      userId: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      UserAddresses?: Array<{
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
      }>;
      age?: number;
    };
  };
};

export type LaboratoryRequestsResponse = {
  message: string;
  data: LaboratoryRequest[];
  status: boolean;
};

export const useLaboratoryRequests = (filters: LaboratoryRequestsFilters) => {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const url = queryString ? `/api/laboratory-requests?${queryString}` : "/api/laboratory-requests";

  const fetcher = async (url: string): Promise<LaboratoryRequestsResponse> => {
    return self.get<LaboratoryRequestsResponse>(url);
  };

  return useSWR<LaboratoryRequestsResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
};
