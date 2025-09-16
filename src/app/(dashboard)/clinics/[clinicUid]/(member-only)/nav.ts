import dynamicIconImports from "lucide-react/dynamicIconImports";
import { getCachedSession } from "@actions/session.action";
import { getClinicMembersAction } from "@/actions/clinics/clinic-member.action";
import { getOrgMembersAction } from "@/actions/organizations/org-member.action";
import { isClinicOwner } from "@lib/clinic-utils";
import { isHP } from "@lib/org-utils";

export const navList: {
  name: string;
  href: string;
  icon: keyof typeof dynamicIconImports;
  permissions: string[];
  requiresHPAndMembership?: boolean;
}[] = [
  {
    name: "Dashboard",
    href: `/dashboard`,
    icon: "home",
    permissions: ["clinic:dashboard"]
  },
  {
    name: "Patient List",
    href: `/patients`,
    icon: "users",
    permissions: ["clinic:patients"],
    requiresHPAndMembership: true
  },
  {
    name: "Appointments",
    href: `/appointments?_aptStatus=all`,
    icon: "calendar",
    permissions: ["clinic:appointments"]
  },
  {
    name: "Consultations",
    href: `/consultations`,
    icon: "stethoscope",
    permissions: ["clinic:consultations"]
  },
  {
    name: "Prescriptions Builder",
    href: `/prescription-builder`,
    icon: "pill",
    permissions: ["clinic:prescriptions"]
  }
]

export const filterNavList = async (clinicUid: string) => {
  try {
    const session = await getCachedSession();
    if (!session) {
      return [];
    }

    const [isOwner, hp, myClinicMembership, myOrganizationMembership] = await Promise.all([
      isClinicOwner(clinicUid),
      isHP(),
      getClinicMembersAction({
        userId: session.user.sub,
        clinicUid,
        status: "ACTIVE"
      }),
      getOrgMembersAction({
        clinicUid,
        userId: session.user.sub,
        status: ["ACTIVE"]
      })
    ]);

    const hasClinicAccess = isOwner || !!myClinicMembership.data?.length || !!myOrganizationMembership.data?.data?.length;

    return navList.filter(item => {
      if (item.requiresHPAndMembership) {
        return hp && hasClinicAccess;
      }

      return hasClinicAccess;
    });
  } catch (error) {
    console.error("Error filtering navigation:", error);
    return [];
  }
}

// Legacy function for backward compatibility - now deprecated
export const filterNavListLegacy = () => {
  console.warn("filterNavListLegacy is deprecated. Use filterNavList(clinicUid) instead.");
  const myPermissionsArray = ["clinic:dashboard", "clinic:patients", "clinic:appointments", "clinic:consultations", "clinic:prescriptions"];
  return navList.filter((items) =>
    items.permissions.some((permission) => myPermissionsArray.includes(permission))
  );
}