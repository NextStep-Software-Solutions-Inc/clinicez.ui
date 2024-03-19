import CarouselComponentNurses from "@components/components/CarouselComponentNurses";

export default async function Nurses() {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="font-bold text-green-500 text-2xl">Meet our Nurses</h1>
            <main>
                <CarouselComponentNurses/>
            </main>   
        </div>
    );
}
