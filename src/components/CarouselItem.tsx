import Image from 'next/image';

export interface ICarouselItemProps {
    item: {
        id: number;
        name: string;
        specialty: string;
        photoUrl: string;
    }
}

export default function CarouselItem({ item }: ICarouselItemProps) {
  return (
    <div className="w-full h-[30rem] relative">
      <Image src={item.photoUrl} alt={item.name} width={1000} height={1000} className="w-full h-[90%] object-cover rounded-lg" />
      <div className="absolute bottom-0 left-0 w-full text-center ">
        <div className="bg-white p-3 rounded-b-lg ">
          <h2 className="text-xl font-semibold">{item.name}</h2>
          <p className="text-base font-normal">{item.specialty}</p>
        </div>
      </div>
    </div>
  );
}
