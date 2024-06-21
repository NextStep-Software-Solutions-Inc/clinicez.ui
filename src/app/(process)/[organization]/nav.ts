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
    name: "Appointments",
    href: `/appointments`,
    icon: "calendar",
  },
  {
    name: "Consultations",
    href: `/consultations`,
    icon: "calendar",
  },
  {
    name: "Files",
    href: `/files`,
    icon: "file",
  }
]