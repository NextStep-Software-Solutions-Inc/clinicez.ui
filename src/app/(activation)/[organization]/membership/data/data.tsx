import { $Enums } from "@prisma/client"
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon
} from "@radix-ui/react-icons"

export const labels = [
  {
    value: "infectious",
    label: "Infectious",
  },
  {
    value: "chronic",
    label: "Chronic",
  },
  {
    value: "acute",
    label: "Acute",
  },
  {
    value: "other",
    label: "Other",
  }
]

export const statuses = Object.values($Enums.UserOrganizationStatus).map((status) => ({
  label: status.split("").map((char, index) => (index === 0 ? char : char.toLowerCase())).join(""),
  value: status,
}))

export const priorities = [
  {
    label: "Low",
    value: "low",
    icon: ArrowDownIcon,
  },
  {
    label: "Medium",
    value: "medium",
    icon: ArrowRightIcon,
  },
  {
    label: "High",
    value: "high",
    icon: ArrowUpIcon,
  },
]
