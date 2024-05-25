import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import Each from "@components/utils/Each";
import { faker } from "@faker-js/faker";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Info, MailWarning, RocketIcon } from "lucide-react";

const createAnnouncements = () => {
  const numberOfAnnouncements = faker.number.int({ min: 1, max: 5 })
  const announcements = []
  for (let i = 0; i < numberOfAnnouncements; i++) {
    const announcement = {
      id: faker.string.uuid(),
      type: faker.helpers.arrayElement(["danger", "info", "success", "warning"]),
      subject: faker.lorem.sentence(),
      message: faker.lorem.paragraph(),
    }
    announcements.push(announcement)
  }
  return announcements
}

const iconType = {
  danger: ExclamationTriangleIcon,
  info: Info,
  success: RocketIcon,
  warning: MailWarning
}

export default async function AlertBanner() {
  const announcements = createAnnouncements()
  return (
    <Each
      of={announcements}
      render={(announcement) => {
        const Icon = iconType[announcement.type as keyof typeof iconType]
        return (
          <Alert variant={["danger", "warning"].includes(announcement.type) ? "destructive": "default"}>
            <Icon className="h-4 w-4" />
            <AlertTitle>{announcement.subject}</AlertTitle>
            <AlertDescription>
              {announcement.message}
            </AlertDescription>
          </Alert>
        );
      }}
    />
  );
}
