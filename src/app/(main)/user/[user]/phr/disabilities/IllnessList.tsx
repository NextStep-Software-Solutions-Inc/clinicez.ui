import { getUserIllnessesAction } from "@actions/user-illness.action";
import IllnessesForm, { IllnessesFormProps } from "./IllnessesForm";

interface IllnessListProps {
  userId: string;
  readOnly?: boolean;
}

export const IllnessList = async ({ userId, readOnly = true }: IllnessListProps) => {

  const userIllnesses = await getUserIllnessesAction(userId);

  const illnesses: IllnessesFormProps["illnesses"] = userIllnesses.map((illness) => {
    return {
      id: illness.id,
      illness: illness.HealthCondition.name,
      severity: illness.severity,
      ...illness.notes ? { notes: illness.notes } : {},
      ...illness.dateDiagnosed ? { dateDiagnosed: new Date(illness.dateDiagnosed) } : {}
    };
  });

  return (
    <IllnessesForm readOnly={readOnly} illnesses={illnesses} />
  );
};
