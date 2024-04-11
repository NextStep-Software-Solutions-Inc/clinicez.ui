import doctors from '@public/doctors.json';
import CarouselWrapper from "@components/CarouselWrapper";
import JoinAsButton from '@components/JoinAs';
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Doctors",
  description: "Meet our Doctors",
};

export default async function Doctors() {
  
  return (
    <div className="container mx-auto ">
      <div className="flex flex-col items-center justify-center min:h-screen relative">
        <h1 className="font-bold text-teal-500 text-3xl mb-5 ">Meet our Doctors</h1>
        <div className='flex flex-col gap-10'>
          <div>
            <CarouselWrapper
              items={doctors}
            />
          </div>
          <div>
            <CarouselWrapper
              items={doctors}
            />
          </div>
          <div>
            <CarouselWrapper
              items={doctors}
            />
          </div>
        </div>
                
        <JoinAsButton href={{
          pathname: "/healthcare-provider/register",
          query: {
            role: "doctor",
            index: "role"  
          }
        }} />
      </div>
    </div>

  );
}