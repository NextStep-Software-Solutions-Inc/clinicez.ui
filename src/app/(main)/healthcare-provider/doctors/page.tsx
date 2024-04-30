import JoinAsButton from '@components/JoinAs';
import { Metadata } from 'next';
import DoctorList from "./DoctorList";
import Suspend from '@components/Suspend';

export const metadata: Metadata = {
  title: "Doctors | Clinic EZ",
  description: "Meet our Doctors",
};

export default async function Doctors() {
  return (
    <div className="container mx-auto">
      <div className="flex flex-col items-center justify-center min:h-screen relative">
        <h1 className="font-bold text-teal-500 text-3xl mb-5 ">Meet our Doctors</h1>
        <Suspend>
          <DoctorList />
        </Suspend>
        <JoinAsButton href={{
          pathname: "/healthcare-provider/apply",
          query: {
            role: "doctor",
          }
        }} />
      </div>
    </div>

  );
}