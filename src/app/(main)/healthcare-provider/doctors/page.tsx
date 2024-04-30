import CarouselWrapper from "@components/CarouselWrapper";
import JoinAsButton from '@components/JoinAs';
import { Metadata } from 'next';
import { getDoctors } from './doctors.request';
import { ICarouselItemProps } from "@components/CarouselItem";

export const metadata: Metadata = {
  title: "Doctors | Clinic EZ",
  description: "Meet our Doctors",
};

export default async function Doctors() {
  const doctors = await getDoctors();
  
  const mappedDoctor: ICarouselItemProps["item"][] = doctors.response.map((doctor) => {
    return {
      id: doctor.profile.id,
      name: `${doctor.profile.title} ${doctor.profile.firstName} ${doctor.profile.middleName} ${doctor.profile.lastName} ${doctor.profile.suffix}`,
      specialty: doctor.profile.fieldOfStudy,
      photoUrl: doctor.profile.profilePhotoUrl,
    }
  })
  
  return (
    <div className="container mx-auto">
      <div className="flex flex-col items-center justify-center min:h-screen relative">
        <h1 className="font-bold text-teal-500 text-3xl mb-5 ">Meet our Doctors</h1>
        <div className='flex flex-col gap-10'>
          <div>
            <CarouselWrapper
              items={mappedDoctor}
            />
          </div>
          <div>
            <CarouselWrapper
              items={mappedDoctor}
            />
          </div>
          <div>
            <CarouselWrapper
              items={mappedDoctor}
            />
          </div>
        </div>
                
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