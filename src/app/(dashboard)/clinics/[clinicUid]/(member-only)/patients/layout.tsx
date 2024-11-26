import { getClinicMembersAction } from "@/actions/clinics/clinic-member.action";
import { getCachedSession } from "@actions/session.action";
import { redirect } from "next/navigation";

interface PatientListLayoutProps {
    children: React.ReactNode;
    params: {
        clinicUid: string;
    }
}
export default async function PatientListLayout({children, params: {clinicUid}}:PatientListLayoutProps) {

  const session = await getCachedSession();
  const myClinicMembership = await getClinicMembersAction({
    userId: session?.user.sub,
    clinicUid,
    status: "ACTIVE"
  })

  if(!myClinicMembership.data?.some(membership =>  membership.Role && ["admin", "owner", ""].includes(membership.Role.name.toLocaleLowerCase()))) redirect("/unauthorized");
  return (
    <>{children}</>
  );
}
