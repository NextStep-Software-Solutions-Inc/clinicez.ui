import CarouselWrapper from "@components/CarouselWrapper";
import JoinAsButton from '@components/JoinAs';
import { getNurses } from './nurses.request';
import { ICarouselItemProps } from '@components/CarouselItem';

export default async function Nurses() {
  const nurses = await getNurses()

  const mappedNurses: ICarouselItemProps["item"][] = nurses.response.map((nurse) => {
    return {
      id: nurse.id,
      name: `${nurse.profile.title} ${nurse.profile.firstName} ${nurse.profile.middleName} ${nurse.profile.lastName} ${nurse.profile.suffix}`,
      specialty: nurse.profile.fieldOfStudy,
      photoUrl: nurse.profile.profilePhotoUrl,
    }
  })

  return (
    <div className="container mx-auto">
      <div className="flex flex-col items-center justify-center min:h-screen relative">
        <h1 className="font-bold text-teal-500 text-3xl mb-5">Meet our Nurses</h1>
        <div className='flex flex-col gap-10'>
          <div>
            <CarouselWrapper
              items={mappedNurses}
            />
          </div>
          <div>
            <CarouselWrapper
              items={mappedNurses}
            />
          </div>
          <div>
            <CarouselWrapper
              items={mappedNurses}
            />
          </div>
        </div> 
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