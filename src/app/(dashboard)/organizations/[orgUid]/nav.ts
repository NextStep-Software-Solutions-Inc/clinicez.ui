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
    name: "Clinics",
    href: `/clinics`,
    icon: "hospital",
    permissions: ["org:clinics"]
  }
]

export const filterNavList = () => {
  const myPermissionsArray = ["org:dashboard", "org:membership", "org:files", "org:clinics"];
  return navList.filter((items) =>
    items.permissions.some((permission) => myPermissionsArray.includes(permission))
  );
}