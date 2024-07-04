import { type Metadata } from 'next';
import OrganizationList from './OrganizationList';
import Suspend from '@components/Suspend';

export const metadata: Metadata = {
  title: "Organizations | Clinic EZ",
  description: "Browse our list of partner organizations that you can join or avail of their services."
}

export default async function Organizations() {
  
  return (
    <div className="container mx-auto my-10">
      <div className="prose max-w-full text-center">
        <h1>Partner Organizations</h1>
        <p>
          Browse our list of partner organizations that you can join or avail of their services.
        </p>
      </div>
      <div className='relative flex flex-col items-center justify-center'>
        <Suspend>
          <OrganizationList/>
        </Suspend>
      </div>
    </div>
  );
}








