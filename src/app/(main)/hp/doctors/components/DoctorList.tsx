import { getDoctorsAction } from "@actions/doctor.action";
import { ICarouselItemProps } from "@components/CarouselItem";
import Each from "@components/utils/Each";
import Image from "next/image";
import Link from "next/link";

export default async function DoctorList() {
  const doctors = await getDoctorsAction();
  
  const mappedDoctor: ICarouselItemProps["item"][] = doctors.map((doctor) => {
    return {
      id: doctor.healthcareProviderId,
      name: `${doctor.title} ${doctor.name} ${doctor.suffix}`,
      fields: doctor.fields,
      photoUrl: doctor.picture ?? "https://integratedmedfl.com/wp-content/uploads/2023/08/dr.png",
      type: "DOCTOR"
    }
  })
  return (
    <div className='flex flex-wrap gap-5'>
      <Each
        of={mappedDoctor}
        render={(item) => (
          <Link href={`/hp/profile/${item.id}?_type=${item.type}`} className="mx-auto h-[20rem] aspect-square relative">
            <Image src={item.photoUrl} alt={item.name} width={1000} height={1000} className="w-full h-full object-cover rounded-lg" />
            <div className="absolute bottom-0 left-0 w-full text-center ">
              <div className="bg-white opacity-75 p-3 rounded-b-lg ">
                <h2 className="text-sm font-semibold">{item.name}</h2>
                <p className="text-xs font-normal">{item.fields.join(", ")}</p>
              </div>
            </div>
          </Link>
        )}
      />
    </div>
  );
}
