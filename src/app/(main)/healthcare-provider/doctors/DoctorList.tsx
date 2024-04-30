import { ICarouselItemProps } from "@components/CarouselItem";
import { getDoctors } from "./doctors.request";
import CarouselWrapper from "@components/CarouselWrapper";

export default  async function DoctorList() {
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
  );
}
