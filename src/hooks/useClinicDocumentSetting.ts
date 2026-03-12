import { GetClinicDocumentSetting } from "@/actions/clinics/clinic-document-setting.action";
import { self } from "@services/request";
import useSWR from "swr";

export const useClinicDocumentSetting = (clinicUid: string) => {
  const fetcher = (url: string) => self.get<GetClinicDocumentSetting>(url);
  return useSWR(`/api/clinics/${clinicUid}/clinic-setting/document-setting`, fetcher);
};
