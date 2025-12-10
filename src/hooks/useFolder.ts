import { self } from "@services/request";
import useSWR from "swr";

export interface FolderData {
  id: number;
  name: string;
  updatedAt: Date;
  Files: Array<{
    id: number;
    name: string;
    url: string;
    size: number;
    dateTaken: Date | null;
    FileType: {
      name: string;
      validUntil: number | null;
    };
    FileSetting: {
      isPublic: boolean;
    } | null;
  }>;
  FolderSetting: {
    id: number;
    isPublic: boolean;
    scopeClinicId: number | null;
    Clinic: {
      clinicUid: string;
    } | null;
  } | null;
}

interface GetFoldersResponse {
  data: FolderData[];
}

interface UseFoldersParams {
  userId: string;
  clinicUid?: string;
}

export const useFolders = ({ userId, clinicUid }: UseFoldersParams) => {
  const fetcher = (args: string) => self.get<GetFoldersResponse>(args);
  const searchParams = new URLSearchParams();
  
  searchParams.append("userId", userId);
  if (clinicUid) searchParams.append("clinicUid", clinicUid);
  
  return useSWR(`/api/folders?${searchParams.toString()}`, fetcher);
};
