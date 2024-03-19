import Carousel from "@components/components/Carousel";
import CarouselComponent from "@components/components/CarouselComponent";
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
                <h1 className="font-bold text-green-500 text-2xl">Meet our Doctors</h1>
                <div>
                    <Carousel {...carouselProps}>
                        {doctorsData.doctors.map((doctor, index) => (
                            <CarouselItem key={index} item={doctor}/>
                        ))}
                    </Carousel>
                    <Carousel {...carouselProps}>
                        {doctorsData.doctors.map((doctor, index) => (
                            <CarouselItem key={index} item={doctor}/>
                        ))}
                    </Carousel>
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
