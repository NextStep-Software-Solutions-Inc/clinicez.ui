import {
  Home,
  File,
  Calendar
} from "lucide-react"

export const navList = [
  {
    name: "Dashboard",
    href: `/dashboard`,
    icon: Home,
  },
  {
    name: "Appointments",
    href: `/appointments`,
    icon: Calendar,
  },
  {
    name: "Consultations",
    href: `/consultations`,
    icon: Calendar,
  },
  {
    name: "Files",
    href: `/files`,
    icon: File,
  }
]