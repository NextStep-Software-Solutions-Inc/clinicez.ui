import { $Enums } from "@prisma/common/client"
export const statuses = Object.values($Enums.UserOrganizationStatus).map((status) => ({
  label: status.split("").map((char, index) => (index === 0 ? char : char.toLowerCase())).join(""),
  value: status,
}))

