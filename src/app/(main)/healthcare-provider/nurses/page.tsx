import JoinAsButton from '@components/JoinAs';
import { Metadata } from "next";
import Suspend from "@components/Suspend";
import NurseList from "./NurseList";

export const metadata: Metadata = {
  title: "Nurses | Clinic EZ",
  description: "Meet our Nurses",
};

export default async function Nurses() {

  return (
    <div className="container mx-auto">
      <div className="flex flex-col items-center justify-center min:h-screen relative">
        <h1 className="font-bold text-teal-500 text-3xl mb-5">Meet our Nurses</h1>
        <Suspend>
          <NurseList />
        </Suspend>
        <JoinAsButton href={{
          pathname: "/healthcare-provider/apply",
          query: {
            role: "nurse",
          }
        }} />  
      </div>
    </div>
  );
}

const Banner = ({label}: {label: string}) => {
  return <div className="bg-white py-2 w-full rounded-full text-center text-xl text-teal-600">{label}</div>
}