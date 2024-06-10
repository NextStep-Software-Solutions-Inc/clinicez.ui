import JoinAsButton from '@components/JoinAs';
import { Metadata } from "next";
import Suspend from "@components/Suspend";
import NurseList from "./NurseList";

export const metadata: Metadata = {
  title: "Nurses | Clinic EZ",
  description: "Our Nurses are here to help you with your healthcare needs.",
};

export default async function Nurses() {

  return (
    <div className="content container mx-auto my-10">
      <div className="prose max-w-full text-center">
        <h1>Meet our Nurses</h1>
        <p>
          Our Nurses are here to help you with your healthcare needs.
        </p>
      </div>
      <div className="flex flex-col items-center justify-center min:h-screen relative my-5">
        <Suspend>
          <NurseList />
        </Suspend>
        <JoinAsButton href={{
          pathname: "/hp/apply",
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