import nurses from '@public/nurses.json';
import CarouselWrapper from "@components/CarouselWrapper";
import JoinAsHealthcareProvider from '@components/JoinAs';
import JoinAsButton from '@components/JoinAs';



const carouselProps = {
  autoPlay: true,
  autoPlaySpeed: 5000,
  showArrows: true,
  infiniteLoop: true,
  showDots: true,
  perPage: 3
}
export default async function Nurses() {
  return (
    <div className="container mx-auto">
      <div className="flex flex-col items-center justify-center min:h-screen relative">
        <h1 className="font-bold text-teal-500 text-3xl mb-5">Meet our Nurses</h1>
        <div className='flex flex-col gap-10'>
          <div>
            <CarouselWrapper
              items={nurses}
            /> 
          </div>
          <div>
            <CarouselWrapper
              items={nurses}
            />
          </div>
          <div>
            <CarouselWrapper
              items={nurses}
            />
          </div>
        </div> 
        <JoinAsButton href={{
          pathname: "/healthcare-provider/register",
          query: {
            role: "nurse"
          }
        }} />  
      </div>
    </div>
  );
}

const Banner = ({label}: {label: string}) => {
  return <div className="bg-white py-2 w-full rounded-full text-center text-xl text-teal-600">{label}</div>
}