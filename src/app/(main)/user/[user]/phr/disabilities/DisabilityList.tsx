import { getUserDisabilitiesAction } from "@actions/user-disability.action";
import DisabilitiesForm from "./DisabilitiesForm";

interface DisabilityListProps {
  userId: string;
  readOnly?: boolean;
}

export type Disability = Awaited<ReturnType<typeof getUserDisabilitiesAction>>[number];
export const DisabilityList = async ({ userId, readOnly = true }: DisabilityListProps) => {

  const userDisabilities = await getUserDisabilitiesAction(userId);

  return (
    <DisabilitiesForm readOnly={readOnly} disabilities={userDisabilities} />
  );
};
