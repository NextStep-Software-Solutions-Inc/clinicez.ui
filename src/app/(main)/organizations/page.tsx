import JoinAsButton from '@components/JoinAs';
import { type Metadata } from 'next';
import OrganizationList from './OrganizationList';
import Suspend from '@components/Suspend';

export const metadata: Metadata = {
  title: "Organizations | Clinic EZ",
  description: "Partner Organizations"
}

export default async function Organizations() {
  
  return (
    <div className="content container mx-auto">
      <div className="w-full text-center text-teal-500 text-3xl mb-5 font-bold">Partner Organizations</div>
      <div className='relative flex flex-col items-center justify-center'>
        <Suspend>
          <OrganizationList/>
        </Suspend>
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








