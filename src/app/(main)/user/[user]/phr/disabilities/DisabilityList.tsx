import { getUserDisabilitiesAction } from "@actions/user-disability.action";
import DisabilitiesForm, { DisabilitiesFormProps } from "./DisabilitiesForm";

interface DisabilityListProps {
  userId: string;
  readOnly?: boolean;
}

export const DisabilityList = async ({ userId, readOnly = true }: DisabilityListProps) => {

  const userDisabilities = await getUserDisabilitiesAction(userId);

  const disabilities: DisabilitiesFormProps["disabilities"] = userDisabilities.map((disability) => {
    return {
      id: disability.id,
      disability: disability.Disability.name,
      severity: disability.severity,
      ...disability.notes ? { notes: disability.notes } : {},
      ...disability.dateDiagnosed ? { dateDiagnosed: new Date(disability.dateDiagnosed) } : {}
    };
  });

  return (
    <DisabilitiesForm readOnly={readOnly} disabilities={disabilities} />
  );
};
