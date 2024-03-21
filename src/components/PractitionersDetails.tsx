
interface IPractitionerDetailsProps {
    id: string;
    title: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    suffix?: string;
    profilePhoto: string;
    email: string;
    number: string;
    specialties: string[];
    user_metadata: Record<string, string | number | string[]>;
}

export default function PractitionerDetails(props: IPractitionerDetailsProps) {
    const { id, firstName, lastName, title, middleName, suffix, profilePhoto, specialties, email, number, user_metadata } = props;
    const fullName = `${title} ${firstName} ${middleName} ${lastName} ${suffix ?? ""}`;

    const objectKeys = Object.keys(user_metadata ?? {});

    const coverPhoto = user_metadata?.["coverPhoto"] ?? "https://art.metro.net/wp-content/uploads/2021/02/placeholder.png";
    const biography = user_metadata?.["biography"] ?? "No biography";
    const address = user_metadata?.["address"] ?? "No address";
    const experience = user_metadata?.["experience"] ?? "No experience";
    const languages = user_metadata?.["languages"] ?? "No languages";
    const fields = user_metadata?.["fields"] ?? "No fields";
    const type = user_metadata?.["type"] ?? "No type";

    return (
        <div className="w-full max-w-screen-xl mx-auto relative px-10">
            {/* Photos */}
            <CoverProfilePhoto coverPhoto={coverPhoto}
                profilePhoto={profilePhoto} />
            {/* Practitioner Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                <ProfileInfo fullName={fullName}
                    specialties={specialties}
                    address={address}
                    biography={biography} />
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    <Title label='EXPERIENCE'
                        desc={experience} />
                    <Title label='LANGUAGES'
                        desc={languages} />
                    <Title label='TYPE OF EMP'
                        desc={type} />
                    <Specialties specialty='SPECIALTIES'
                        field={fields} />
                    <ContactInfo
                        email={email}
                        number={number}
                    />
                </div>
            </div>
        </div>
    );
}


// Components
const CoverProfilePhoto = ({ coverPhoto, profilePhoto }: { coverPhoto: any, profilePhoto: any }) => {
    return <div className="w-full h-80 bg-cover bg-center relative rounded-lg" style={{ backgroundImage: `url(${coverPhoto})` }}>
    <div className="absolute bottom-0 left-4 transform translate-y-1/3 z-10">
        <div className="w-40 h-40 bg-white rounded-full overflow-hidden">
            <img src={profilePhoto} className="rounded-full w-full h-full object-cover" />
        </div>
    </div>
</div>

}
const Title = ({ label, desc }: { label: string, desc: any }) => {
    return <div className="p-4 rounded-lg flex">
        <h2 className="text-teal-500 font-medium text-2xl">{label}</h2>
        <p className="text-gray-500 text-xl ml-10">{desc}</p>
    </div>
}

const Specialties = ({ specialty, field }: { specialty: string, field: any }) => {
    return <div className="p-4 rounded-lg mt-8">
        <div className="inline-block">
            <h2 className="text-teal-500 font-medium text-2xl mb-2">{specialty}</h2>
            <p className="text-teal-500 text-xl border-teal-500 border-2 rounded-full inline-block px-4 py-2 italic">
                {field}
            </p>

        </div>
    </div>
}

const ContactInfo = ({ email, number }: { email: string, number: string }) => {
    return <div className="p-4 rounded-lg mt-8">
            <h2 className="text-teal-500 font-medium text-2xl mb-4 mr-4">CONTACT</h2>
            <div className="flex items-center border-l-4 border-teal-500 h-6">
                <div className="ml-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2 fill-teal-500">
                    <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                    <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
                </svg>
                </div>
                <p className="text-teal-500 text-xl font-semibold">{email}</p>
            </div>
            <div className="flex items-center border-l-4 border-teal-500 h-6  ">
                 <div className="ml-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 fill-teal-500">
                    <path fill-rule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clip-rule="evenodd" />
                </svg>
                </div>
                <p className="text-teal-500 text-xl font-semibold">{number}</p>
            </div>
        </div>
}


const ProfileInfo = ({ fullName, specialties, address, biography }: { fullName: string, specialties: any, address: any, biography: any }) => {
    return <div className="col-span-1">
            <div className="w-full text-teal-500 text-2xl mb-5 font-semibold flex items-center flex-col sm:flex-row pt-8">
                <span>{fullName}</span>
                <div className="w-36 text-center text-white bg-teal-500 font-medium text-sm mb-5 sm:mb-0 rounded-full">
                    {Array.isArray(specialties) && specialties.join(', ')}
                </div>
            </div>
            <div className="w-full text-teal-500 text-2xl mb-5 font-bold flex items-center flex-col sm:flex-row">
                <p className="text-gray-500 text-base font-medium ">{address}</p>
            </div>
            <h2 className="text-teal-500 text-2xl font-semibold">BIOGRAPHY</h2>
            <div className="bg-white bg-opacity-80 p-4 rounded-lg">
                <p className="text-gray-700 text-base font-semibold">{biography}</p>
            </div>
        </div>
}





