import { GetClinicAppointmentConfig } from "@actions/appointments/appointment-config.action"
import { self } from "@services/request"
import useSWR from "swr"

export const useOrgAppointmentConfig = (clinicUid: string) => {
  const fetcher = (args:string) => self.get<GetClinicAppointmentConfig>(args)
  return useSWR(`/api/clinics/${clinicUid}/clinic-setting/appointment-config`, fetcher)

}
