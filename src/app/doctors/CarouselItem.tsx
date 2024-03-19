import Image from 'next/image';

interface ICarouselItemProps {
    item: {
        name: string;
        specialty: string;
        photoUrl: string;
    }
}
export default function CarouselItem({item}: ICarouselItemProps) {
  return (
    <div className="flex flex-col items-center justify-center">
        <Image src={item.photoUrl} alt={item.name} width={200} height={200} className="rounded-tl-[20px] rounded-tr-[20px]" />
        <h1 className="font-bold text-green-500 text-xl">{item.name}</h1>
        <p className="text-center">{item.specialty}</p>
    </div>
    
    // <div className="w-[459.16px] h-[627px] relative">
    //             <img className="w-[459.16px] h-[499px] left-0 top-0 absolute rounded-tl-[20px] rounded-tr-[20px]" src="https://via.placeholder.com/459x499" />
    //             <div className="w-[459.16px] h-[132px] left-0 top-[495px] absolute bg-white rounded-bl-[20px] rounded-br-[20px]" />
    //             <div className="w-[418.70px] left-[20.23px] top-[538px] absolute text-center text-teal-500 text-2xl font-semibold font-['Hartwell Alt']">Dr. Amelia Jones</div>
    //             <div className="w-[418.70px] left-[20.23px] top-[570px] absolute text-center text-teal-500 text-xl font-normal font-['Hartwell']">Cardiology</div>
    //         </div>
  )
}
