import Each from "@components/utils/Each";
import { OrganizationCard } from "@components/OrganizationCard";
import { getOrganizationsAction } from "@actions/organizations/organization.action";

export default async function OrganizationList() {
  const organizations = await getOrganizationsAction()

  return (
    <div className="flex flex-wrap justify-center gap-2 my-10"> {/* Changed the grid layout */}
      <Each
        of={organizations}
        render={(organization, index) => (
          <OrganizationCard organization={organization}/>
        )}
      />
    </div>
  );
}
