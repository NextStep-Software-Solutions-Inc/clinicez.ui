import { getUserIllnessesAction } from "@actions/users/user-illness.action";
import IllnessesForm, { IllnessesFormProps } from "./IllnessesForm";

interface IllnessListProps {
  userId: string;
  readOnly?: boolean;
}

export type Illness = Awaited<ReturnType<typeof getUserIllnessesAction>>[number];
export const IllnessList = async ({ userId, readOnly = true }: IllnessListProps) => {

  const userIllnesses = await getUserIllnessesAction(userId);

  return (
    <IllnessesForm readOnly={readOnly} illnesses={userIllnesses} />
  );
};
