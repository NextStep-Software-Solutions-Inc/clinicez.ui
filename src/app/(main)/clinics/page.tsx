import { type Metadata } from 'next';
import Suspend from '@components/Suspend';
import ClinicList from '@/components/clinic/ClinicList';

export const metadata: Metadata = {
  title: "Clinics | Clinic EZ",
  description: "Find a clinic near you. View their services, providers, and more.",
}

export default async function Clinics() {
  
  return (
    <div className="container mx-auto my-10">
      <div className="prose max-w-full text-center">
        <h1>Clinics inside Clinic EZ</h1>
        <p>
          Find a clinic near you. View their services, providers
        </p>
      </div>
      <div className='relative flex flex-col items-center justify-center'>
        <Suspend>
          <ClinicList/>
        </Suspend>
      </div>
    </div>
  );
}








