import { getUserAllergiesAction } from "@actions/user-allergy.action";
import AllergiesForm from "./AllergiesForm";

interface AllergyListProps {
  userId: string;
  readOnly?: boolean;
}

export const AllergyList = async ({ userId, readOnly = true }: AllergyListProps) => {

  const allergies = await getUserAllergiesAction(userId);

  return (
    <AllergiesForm readOnly={readOnly} allergies={allergies} />
  );
};
