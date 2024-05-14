import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircledIcon,
  CircleIcon,
  CrossCircledIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
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

export const statuses = [
  {
    value: "new",
    label: "New",
    icon: CircleIcon,
  },
  {
    value: "in-progress",
    label: "In progress",
    icon: StopwatchIcon,
  },
  {
    value: "completed",
    label: "Completed",
    icon: CheckCircledIcon,
  },
  {
    value: "canceled",
    label: "Canceled",
    icon: CrossCircledIcon,
  },
  {
    value: "on-hold",
    label: "On hold",
    icon: QuestionMarkCircledIcon,
  }
]

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
