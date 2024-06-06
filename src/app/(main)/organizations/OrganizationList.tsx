import Each from "@components/utils/Each";
import { getOrganizations } from "./organizations.request";
import { OrganizationCard } from "@components/OrganizationCard";

export default async function OrganizationList() {
  const organizations = await getOrganizations()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-8 mt-8 mb-10"> {/* Changed the grid layout */}
      <Each
        of={organizations.response}
        render={(organization, index) => (
          <OrganizationCard organization={organization}/>
        )}
      />
    </div>
  );
}
