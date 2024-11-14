import dynamicIconImports from "lucide-react/dynamicIconImports";

export const navList: {
  name: string;
  href: string;
  icon: keyof typeof dynamicIconImports;
  permissions: string[]
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
    permissions: ["clinic:patients"]
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

export const filterNavList = () => {
  const myPermissionsArray = ["clinic:dashboard", "clinic:patients", "clinic:appointments", "clinic:consultations", "clinic:prescriptions"];
  return navList.filter((items) =>
    items.permissions.some((permission) => myPermissionsArray.includes(permission))
  );
}