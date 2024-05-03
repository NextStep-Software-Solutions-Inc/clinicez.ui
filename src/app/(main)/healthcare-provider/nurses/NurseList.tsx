import { ICarouselItemProps } from "@components/CarouselItem";
import { getNurses } from "./nurses.request";
import CarouselWrapper from "@components/CarouselWrapper";

export default  async function NurseList() {
  const nurses = await getNurses();
  
  const mappedNurses: ICarouselItemProps["item"][] = nurses.response.map((nurse) => {
    return {
      id: nurse.id,
      name: `${nurse.profile.title} ${nurse.profile.firstName} ${nurse.profile.middleName} ${nurse.profile.lastName} ${nurse.profile.suffix}`,
      specialty: nurse.profile.fieldOfStudy,
      photoUrl: nurse.profile.profilePhotoUrl,
    }
  })
  return (
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
  );
}
