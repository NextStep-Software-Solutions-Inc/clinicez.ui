import Carousel from "@components/components/Carousel";
import doctorsData from '../../../public/doctors.json';
import CarouselItem from "./CarouselItem";

const carouselProps = {
    autoPlay: true,
    autoPlaySpeed: 5000,
    showArrows: true,
    infiniteLoop: true,
    showDots: true,
    perPage: 3
}
export default async function Doctors() {
    return (
        <div className="container mx-auto">
            <div className="flex flex-col items-center justify-center min:h-screen">
                <h1 className="font-bold text-teal-500 text-5xl pb-2">Meet our Doctors</h1>
                <div>
                <button className="bg-white h-20 w-full rounded-full font-bold text-4xl text-teal-500">HIMS</button>
                    <Carousel {...carouselProps}>
                        {doctorsData.doctors.map((doctor, index) => (
                            <CarouselItem key={index} item={doctor}/>
                        ))}
                    </Carousel>
                    <button className="bg-white h-20 w-full rounded-full font-bold text-4xl text-teal-500">Xavier University</button>
                    <Carousel {...carouselProps}>
                        {doctorsData.doctors.map((doctor, index) => (
                            <CarouselItem key={index} item={doctor}/>
                        ))}
                    </Carousel>
                    <button className="bg-white h-20 w-full rounded-full font-bold text-4xl text-teal-500">Northern Mindanao Medical Center</button>
                    <Carousel {...carouselProps}>
                        {doctorsData.doctors.map((doctor, index) => (
                            <CarouselItem key={index} item={doctor}/>
                        ))}
                    </Carousel>
                </div>   
            </div>
        </div>
    );
}
