import EmergencyContactForm from "./EmergencyContactForm";
import { getEmergencyContactsAction } from "@actions/emergency-contact.action";

interface EmergencyContactFormProps {
  sessionUserId: string;
  readOnly?: boolean;
  userId: string;
}

export const EmergencyContacts = async ({ userId, ...props }: EmergencyContactFormProps) => {
  const contacts = await getEmergencyContactsAction(userId);
  return (
    <EmergencyContactForm {...props} contacts={contacts} />
  );
};
