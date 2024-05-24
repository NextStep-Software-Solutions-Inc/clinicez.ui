import JoinAsButton from '@components/JoinAs';
import { Metadata } from 'next';
import DoctorList from "./DoctorList";
import Suspend from '@components/Suspend';

export const metadata: Metadata = {
  title: "Doctors | Clinic EZ",
  description: "Our experienced Doctors are equipped with the latest technology to provide you with the best care possible.",
};

export default async function Doctors() {
  return (
    <div className="content container mx-auto mt-10">
      <div className="prose max-w-full text-center">
        <h1>Meet our Doctors</h1>
        <p>
          Our experienced Doctors are equipped with the latest technology to provide you with the best care possible.
        </p>
      </div>
      <div className="flex flex-col items-center justify-center min:h-screen relative my-5">
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