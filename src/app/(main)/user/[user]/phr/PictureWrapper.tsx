import { getUserAction } from "@actions/users/user.action";
import { Picture } from "./Picture";

interface PictureWrapperProps {
  userId: string;
  readOnly?: boolean;
}

export const PictureWrapper = async ({ userId, readOnly }: PictureWrapperProps) => {
  const user = await getUserAction(userId);
  return (
    <Picture user={user} readOnly={readOnly} />
  );
};
