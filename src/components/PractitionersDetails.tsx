export default function PractitionerDetails({
    name,
    profilePhoto,
    specialty,
    address,
    biography,
    years,
    languages,
    field,
    email,
    number,
}: {
    name: string;
    profilePhoto: string;
    specialty: string;
    address: string;
    biography: string;
    years: string;
    languages: string;
    field: string;
    email: string;
    number: string;
}) {
    return (
        <div className="w-full max-w-screen-xl mx-auto relative px-10">
            {/* Cover Photo */}
            <div
                className="w-full h-64 bg-cover bg-center relative rounded-lg"
                style={{
                    backgroundImage:
                        "url('https://hips.hearstapps.com/hmg-prod/images/portrait-of-a-happy-young-doctor-in-his-clinic-royalty-free-image-1661432441.jpg?crop=0.66698xw:1xh;center,top&resize=1200:*')",
                }}
            >
                {/* Profile Photo */}
                <div className="absolute bottom-0 left-4 transform translate-y-1/2 z-10 ">
                    <div className="w-40 h-32 bg-white rounded-full flex items-center justify-start">
                        <img
                            src={profilePhoto}
                            className="rounded-full"
                        />
                    </div>
                </div>
            </div>
            {/* Practitioner Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                <div className="col-span-1">
                    <div className="w-full text-teal-500 text-2xl mb-5 font-bold flex  items-center flex-col sm:flex-row pt-12">
                        <span>{name}</span>
                        <div className="w-36 text-center text-white bg-teal-500 text-sm mb-5 sm:mb-0 rounded-full">{specialty}</div>
                    </div>
                    <div className="w-full text-teal-500 text-2xl mb-5 font-bold flex items-center flex-col sm:flex-row">
                        <p className="text-gray-400 text-base font-semibold ">{address}</p>
                    </div>
                    <h2 className="text-teal-500 text-2xl font-semibold ">BIOGRAPHY</h2>
                    <div className="bg-white bg-opacity-80 p-4 rounded-lg">
                        <p className="text-black text-base font-semibold">{biography}</p>
                    </div>
                </div>
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    <div className="p-4 rounded-lg">
                        <h2 className="text-teal-500 text-2xl font-semibold mb-4">EXPERIENCE</h2>
                        <p className="text-gray-400 text-xl font-semibold">{years}</p>
                    </div>
                    <div className="p-4 rounded-lg mt-8">
                        <h2 className="text-teal-500 text-2xl font-semibold mb-4">LANGUAGES</h2>
                        <p className="text-gray-400 text-xl font-semibold">{languages}</p>
                    </div>
                    <div className="p-4 rounded-lg mt-8">
                        <h2 className="text-teal-500 text-2xl font-semibold mb-4">TYPES OF</h2>
                        <p className="text-gray-400 text-xl font-semibold  ">{field}</p>
                    </div>
                    <div className="p-4 rounded-lg mt-8">
                        <h2 className="text-teal-500 text-2xl font-semibold mb-4">CONTACT</h2>
                        <p className="text-teal-500 text-xl font-semibold flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                                <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                                <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
                            </svg>
                            {email}
                        </p>
                        <p className="text-teal-500 text-xl font-semibold flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path fill-rule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clip-rule="evenodd" />
                            </svg>

                            {number}
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
