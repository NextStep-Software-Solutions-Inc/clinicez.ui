import { Metadata } from "next";
import Suspend from "@components/Suspend";
import HPList from '@components/HPList';

export const metadata: Metadata = {
  title: "Healthcare Providers | Clinic EZ",
  description: "Our Healthcare Providers are equipped with the latest technology to provide you with the best care possible.",
};

export default async function HealthcareProvidersPage() {

  return (
    <div className="container mx-auto my-10">
      <div className="prose max-w-full text-center">
        <h1>Meet our Healthcare Providers </h1>
        <p>
          Our Healthcare Providers are equipped with the latest technology to provide you with the best care possible.
        </p>
      </div>
      <div className="flex flex-col items-center justify-center min:h-screen relative my-5">
        <Suspend>
          <HPList />
        </Suspend>
      </div>
    </div>
  );
}

const Banner = ({label}: {label: string}) => {
  return <div className="bg-white py-2 w-full rounded-full text-center text-xl text-teal-600">{label}</div>
}