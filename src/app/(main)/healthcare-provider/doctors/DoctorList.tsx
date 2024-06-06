import { getDoctorsAction } from "@actions/doctor.action";
import { ICarouselItemProps } from "@components/CarouselItem";
import CarouselWrapper from "@components/CarouselWrapper";

export default async function DoctorList() {
  const doctors = await getDoctorsAction();
  
  const mappedDoctor: ICarouselItemProps["item"][] = doctors.map((doctor) => {
    return {
      id: doctor.healthcareProviderId,
      name: `${doctor.title} ${doctor.name} ${doctor.suffix}`,
      fields: doctor.fields,
      photoUrl: doctor.picture ?? "https://via.placeholder.com/1000",
    }
  })
  return (
    <div className='flex flex-col gap-10'>
      <div>
        <CarouselWrapper
          items={mappedDoctor}
        />
      </div>
    </div>
  );
}
