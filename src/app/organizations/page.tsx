export default async function Organizations() {
    return (
        <div className="w-full max-w-screen-xl mx-auto relative px-10">
            <div className="w-full text-center text-teal-500 text-3xl mb-5 font-bold">Partner Organizations</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-8 mt-8"> {/* Changed the grid layout */}
                <OrganizationCard
                    name="Healthcare Information and Management System (HIMS) by University of Science and Technology of Southern Philippines (USTP)"
                    imageSrc="https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Hospital-de-Bellvitge.jpg/640px-Hospital-de-Bellvitge.jpg"
                    details="The Healthcare Information and Management System (HIMS) is a web-based 
                    application that is designed to manage the health records of the patients.
                     It is developed by the University of Science and Technology of Southern Philippines (USTP) 
                     in Cagayan de Oro City, Misamis Oriental, Philippines."
                />
                <OrganizationCard
                    name="Xavier University - Ateneo de Cagayan"
                    imageSrc="https://pidswebs.pids.gov.ph/CDN/featured-image/PR_DP2242-2.jpg"
                    details="Xavier University - Ateneo de Cagayan is a private Catholic university run 
                    by the Philippine Province of the Society of Jesus in Cagayan de Oro City, 
                    Misamis Oriental, Philippines."
                />
                <OrganizationCard
                    name="Northern Mindanao Medical Center"
                    imageSrc="https://i.pinimg.com/736x/ac/6f/5f/ac6f5fe34103c4a8dadcd2375ad3e5eb.jpg"
                    details="The Northern Mindanao Medical Center is a 
                    government-owned hospital in Cagayan de Oro City, Misamis Oriental, Philippines."
                />
                <OrganizationCard
                    name="Misamis Oriental Provincial Hospital"
                    imageSrc="https://www.rappler.com/tachyon/r3-assets/612F469A6EA84F6BAE882D2B94A4B421/img/F3889900C6DE4ECDBD6991E66439D784/cdo-city-hospital-061117-1.jpg"
                    details="The Misamis Oriental Provincial Hospital is a government-owned hospital in 
                    Cagayan de Oro City, Misamis Oriental, Philippines."
                />
            </div>
        </div>
    );
}

function OrganizationCard({ name, imageSrc, details }: { name: string; imageSrc: string, details: string }) {
    return (
        <div className="group bg-white rounded-lg shadow-md overflow-hidden relative">
            <div className="group bg-white shadow-md overflow-hidden relative">
                <img src={imageSrc} alt={name} className="w-full h-[25rem]" />
                <div className="absolute inset-0 bg-teal-700 opacity-0 transition duration-300 ease-in-out group-hover:opacity-50 flex items-center justify-center text-white">
                    <div>
                        <p className="text-sm text-center p-2">{details}</p>
                    </div>
                </div>
            </div>
            <div className="p-4 relative z-10">
                <h2 className="text-teal-500 text-xl font-semibold mb-2">{name}</h2>
            </div>
        </div>
    );
}






