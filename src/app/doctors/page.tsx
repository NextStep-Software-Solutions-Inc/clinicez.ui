import doctorsData from '../../../public/doctors.json';
import CarouselWrapper from "@components/CarouselWrapper";

export default async function Doctors() {

    return (
        <div className="container mx-auto ">
            <div className="flex flex-col items-center justify-center min:h-screen">
                <h1 className="font-bold text-teal-500 text-3xl mb-5 ">Meet our Doctors</h1>
                <div className='flex flex-col gap-10'>
                    <div>
                        <a href="/practitioners">
                            <Banner label='HIMS' />
                            <CarouselWrapper
                                items={doctorsData.doctors}
                            />
                        </a>
                    </div>
                    <div>
                    <a href="/practitioners">
                        <Banner label='Xavier University' />
                        <CarouselWrapper
                            items={doctorsData.doctors}
                        />
                        </a>
                    </div>
                    <div>
                    <a href="/practitioners">
                        <Banner label='Northern Mindanao Medical Center' />
                        <CarouselWrapper
                            items={doctorsData.doctors}
                        />
                         </a>
                    </div>
                </div>
            </div>
        </div>

    );
}


const Banner = ({ label }: { label: string }) => {
    return <div className="bg-white py-2 w-full rounded-full text-center text-xl text-teal-600">{label}</div>
}