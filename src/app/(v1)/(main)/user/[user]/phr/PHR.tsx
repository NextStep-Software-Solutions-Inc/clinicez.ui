import { notFound } from "next/navigation";
import { PersonalInformationForm } from "./PersonalInformationForm";
import { getUserAction } from "@actions/users/user.action";

interface PHRProps {
  userId: string;
  readOnly?: boolean;
}

export const PHR = async ({ userId, readOnly = true }: PHRProps) => {
  const user = await getUserAction(userId);
  if(!user.data) notFound();
  return (
    <PersonalInformationForm user={user.data} readOnly={readOnly} />
  );
};
