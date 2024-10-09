"use client";

import { getUserVaccinationsAction } from "@actions/users/user-vaccination.action";
import Each from "@components/utils/Each";
import VaxItem from "./VaxItem";

interface VaccinationFormProps {
  vaccinations: Awaited<ReturnType<typeof getUserVaccinationsAction>>;
  readOnly?: boolean;
}
export const VaccinationForm = ({ vaccinations, readOnly }: VaccinationFormProps) => {
  return (
    <Each
      of={vaccinations}
      fallback={<div className="text-muted-foreground">No vaccination record declared.</div>}
      render={(vaccination) => <VaxItem key={vaccination.id} readOnly={readOnly} vaccination={vaccination} />} 
    />
  );
};
