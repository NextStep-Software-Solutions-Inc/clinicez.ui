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
    permissions: ["org:dashboard"]
  },
  {
    name: "Membership",
    href: `/membership`,
    icon: "list-checks",
    permissions: ["org:membership"]
  },
  {
    name: "Patient List",
    href: `/patients`,
    icon: "users",
    permissions: ["org:patients"]
  },
  {
    name: "Appointments",
    href: `/appointments?_aptStatus=all`,
    icon: "calendar",
    permissions: ["org:appointments"]
  },
  {
    name: "Consultations",
    href: `/consultations`,
    icon: "stethoscope",
    permissions: ["org:consultations"]
  },
  {
    name: "Files",
    href: `/files`,
    icon: "file",
    permissions: ["org:files"]
  },
  {
    name: "Prescriptions Builder",
    href: `/prescription-builder`,
    icon: "pill",
    permissions: ["org:prescriptions"]
  }
]

export const filterNavList = () => {
  const myPermissionsArray = ["org:dashboard", "org:membership", "org:patients", "org:appointments", "org:consultations", "org:files", "org:prescriptions"];
  return navList.filter((items) =>
    items.permissions.some((permission) => myPermissionsArray.includes(permission))
  );
}