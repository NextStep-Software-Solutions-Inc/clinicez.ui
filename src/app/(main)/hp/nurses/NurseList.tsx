import { ICarouselItemProps } from "@components/CarouselItem";
import { getNursesAction } from "@actions/nurse.action";
import Each from "@components/utils/Each";
import Image from "next/image";
import Link from "next/link";

export default  async function NurseList() {
  const nurses = await getNursesAction();
  
  const mappedNurses: ICarouselItemProps["item"][] = nurses.map((nurse) => {
    return {
      id: nurse.healthcareProviderId,
      name: `${nurse.title} ${nurse.name} ${nurse.suffix}`,
      fields: nurse.fields,
      photoUrl: nurse.picture ?? "https://integratedmedfl.com/wp-content/uploads/2023/08/dr.png",
      type: "NURSE"
    }
  })
  return (
    <div className='flex flex-wrap justify-center gap-5'>
      <Each
        of={mappedNurses}
        render={(item) => (
          <Link href={`/hp/profile/${item.id}?_type=${item.type}`} className="h-[20rem] aspect-square relative">
            <Image src={item.photoUrl} alt={item.name} width={1000} height={1000} className="w-full h-full object-cover object-top rounded-lg" />
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
