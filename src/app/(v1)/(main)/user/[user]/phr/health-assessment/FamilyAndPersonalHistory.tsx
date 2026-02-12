import { getHealthHistoryAction } from "@/actions/family-and-personal-history.action";
import { FamilyAndPersonalHistoryForm } from "./FamilyAndPersonalHistoryForm";

interface FamilyAndPersonalHistoryProps {
  userId: string;
  readOnly?: boolean;
}

export const FamilyAndPersonalHistory = async ({
  userId,
  readOnly = true
}: FamilyAndPersonalHistoryProps) => {
  const history = await getHealthHistoryAction(userId);
  
  return (
    <FamilyAndPersonalHistoryForm 
      userId={userId} 
      readOnly={readOnly}
      initialData={history.data}
    />
  );
}
