import { ICarouselItemProps } from "@components/CarouselItem";
import Each from "@components/utils/Each";
import Image from "next/image";
import Link from "next/link";
import { HealthcareProviderType } from "@prisma/common/client";
import { getHPsAction } from "@actions/hp.actions";
interface HPListProps {
  type: HealthcareProviderType
}
export default async function HPList({ type }: HPListProps) {
  const hps = await getHPsAction({
    type: type,
    isPublished: true,
  });
  
  const mappedHp: ICarouselItemProps["item"][] = hps.map((hp) => {
    return {
      id: hp.id,
      name: `${hp.HPProfile?.title} ${hp.HPProfile?.name} ${hp.HPProfile?.suffix}`,
      fields: hp.HPProfile?.fields ?? [],
      photoUrl: hp.HPProfile?.picture ?? "https://integratedmedfl.com/wp-content/uploads/2023/08/dr.png",
      type: "DOCTOR"
    }
  })
  return (
    <div className='flex flex-wrap justify-center gap-5'>
      <Each
        of={mappedHp}
        render={(item) => (
          <Link href={`/hp/profile/${item.id}`} className="h-[20rem] aspect-square relative">
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
