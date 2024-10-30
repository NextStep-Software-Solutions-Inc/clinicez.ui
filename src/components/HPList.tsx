import { ICarouselItemProps } from "@components/CarouselItem";
import Each from "@components/utils/Each";
import Image from "next/image";
import Link from "next/link";
import { getHPsAction } from "@actions/hp.actions";
import { FEMALE_DOCTOR_AVATAR, MALE_DOCTOR_AVATAR } from "@lib/contants";
interface HPListProps {
  hpTypeId?: number
}
export default async function HPList({ hpTypeId }: HPListProps) {
  const hps = await getHPsAction({ hpTypeId, isPublished: true, });
  
  const mappedHp: ICarouselItemProps["item"][] = hps.map((hp) => {
    return {
      id: hp.id,
      name: `${hp.HPProfile?.title ?? ""} ${hp.HPProfile?.name ?? ""} ${hp.HPProfile?.suffix ?? ""}`,
      fields: hp.HPProfile?.fields ?? [],
      photoUrl: hp.HPProfile?.picture ||  (hp.User.gender === "FEMALE" ? FEMALE_DOCTOR_AVATAR: MALE_DOCTOR_AVATAR)
    }
  })
  return (
    <div className='flex flex-wrap justify-center gap-5'>
      <Each
        of={mappedHp}
        render={(item) => (
          <Link href={`/hp/${item.id}`} className="h-[20rem] aspect-square relative">
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
