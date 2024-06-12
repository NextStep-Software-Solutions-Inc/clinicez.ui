import Each from "@components/utils/Each";
import { OrganizationCard } from "@components/OrganizationCard";
import { getOrganizationsAction } from "@actions/organization.action";

export default async function OrganizationList() {
  const organizations = await getOrganizationsAction()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-8 mt-8 mb-10"> {/* Changed the grid layout */}
      <Each
        of={organizations}
        render={(organization, index) => (
          <OrganizationCard organization={organization}/>
        )}
      />
    </div>
  );
}
