import { getUserAction } from "@actions/users/user.action";
import { Picture } from "./Picture";
import { notFound } from "next/navigation";

interface PictureWrapperProps {
  userId: string;
  readOnly?: boolean;
}

export const PictureWrapper = async ({ userId, readOnly }: PictureWrapperProps) => {
  const user = await getUserAction(userId);
  if(!user.data) notFound();
  return (
    <Picture user={user.data} readOnly={readOnly} />
  );
};
