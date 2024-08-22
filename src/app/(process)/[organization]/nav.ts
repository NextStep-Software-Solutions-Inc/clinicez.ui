import dynamicIconImports from "lucide-react/dynamicIconImports";

export const navList: {
  name: string;
  href: string;
  icon: keyof typeof dynamicIconImports;
}[] = [
  {
    name: "Dashboard",
    href: `/dashboard`,
    icon: "home",
  },
  {
    name: "Membership",
    href: `/membership`,
    icon: "list-checks",
  },
  {
    name: "Patient List",
    href: `/patients`,
    icon: "users",
  },
  {
    name: "Appointments",
    href: `/appointments?_aptStatus=all`,
    icon: "calendar",
  },
  {
    name: "Consultations",
    href: `/consultations`,
    icon: "stethoscope",
  },
  {
    name: "Files",
    href: `/files`,
    icon: "file",
  }
]