import { ContactInfo, CoverProfilePhoto, ProfileInfo, Specialties, Title } from "./PractitionerLayout";

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
    fields: string[];
    user_metadata: Record<string, string | number | string[]>;
}

export default function PractitionerDetails(props: IPractitionerDetailsProps) {
  const { id, firstName, lastName, title, middleName, suffix, profilePhoto, fields, email, number, user_metadata } = props;
  const fullName = `${title} ${firstName} ${middleName} ${lastName} ${suffix ?? ""}`;

  const coverPhoto = (user_metadata?.["coverPhoto"] ?? "https://art.metro.net/wp-content/uploads/2021/02/placeholder.png") as string;
  const biography = (user_metadata?.["biography"] ?? "No biography") as string;
  const address = (user_metadata?.["address"] ?? "No address") as string;
  const experience = user_metadata?.["experience"] ?? "No experience";
  const languages = user_metadata?.["languages"] ?? "No languages";
  const specialties = (user_metadata?.["specialties"] ?? []) as string[];
  const type = user_metadata?.["type"] ?? "No type";

  return (
    <div className="w-full relative max-sm:px-1">
      {/* Photos */}
      <CoverProfilePhoto coverPhoto={coverPhoto}
        profilePhoto={profilePhoto} />
      {/* Practitioner Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 md:gap-8 mt-8">
        <ProfileInfo fullName={fullName}
          fields={fields}
          address={address}
          biography={biography} />
        <div className="col-span-1 md:col-span-2 max-md:mt-5">
          <div className="flex flex-col gap-5">
            <Title label='EXPERIENCE'
              desc={experience} />
            <Title label='LANGUAGES'
              desc={languages} />
            <Title label='TYPE OF EMPLOYMENT'
              desc={type} />
            <Specialties specialties={specialties} />
            <ContactInfo
              email={email}
              number={number}
            />
          </div>
        </div>
      </div>
    </div>
  );
}





