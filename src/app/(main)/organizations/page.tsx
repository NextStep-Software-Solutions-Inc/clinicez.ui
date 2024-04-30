import JoinAsButton from '@components/JoinAs';
import { OrganizationCard } from '@components/OrganizationCard';
import { getOrganizations } from './organizations.request';
import Each from '@components/utils/Each';
import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: "Organizations | Clinic EZ",
  description: "Partner Organizations"
}

export default async function Organizations() {
  const organizations = await getOrganizations()
  
  return (
    <div className="content container mx-auto">
      <div className="w-full text-center text-teal-500 text-3xl mb-5 font-bold">Partner Organizations</div>
      <div className='relative flex flex-col items-center justify-center'>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-8 mt-8 mb-10"> {/* Changed the grid layout */}
          <Each
            of={organizations.response}
            render={(organization, index) => (
              <OrganizationCard
                key={index}
                url={organization.url}
                name={organization.name}
                imageSrc={organization.coverPhoto}
                details={organization.bio}
              />
            )}
          />
        </div>
        <JoinAsButton 
          href={{
            pathname: "/tenants/register",
            query: {
              role: "tenant"
            }
          }}
        /> 
            
      </div>
    </div>
  );
}








