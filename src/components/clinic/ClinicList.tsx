import Each from "@components/utils/Each";
import { getClinicsAction } from "@actions/clinics/clinic.action";
import { ClinicCard } from "./ClinicCard";

export default async function ClinicList() {
  const clinics = await getClinicsAction()

  return (
    <div className="flex flex-wrap justify-center gap-2 my-10"> {/* Changed the grid layout */}
      <Each
        of={clinics.data ?? []}
        fallback={<div className="text-muted-foreground text-center">No Clinic to show</div>}
        render={(clinic, index) => (
          <ClinicCard key={index} clinic={clinic}/>
        )}
      />
    </div>
  );
}
