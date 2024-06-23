import { Organization } from "@prisma/client";
import Image from "next/image";
import organizationPlaceholder from "@public/assets/organization_placeholder.jpg";
import Link from "next/link";
import ActionButton from "./ActionButton";

interface OrganizationCardProps {
  organization: Organization
}

export async function OrganizationCard({ organization }: OrganizationCardProps) {
  const {orgId, name, description, picture} = organization;

  const action = async () => {
    "use server";
    console.log("Joining organization");
  }

  return (
    <div className="relative">
      <Link href={`/${orgId}`} className="">
        <div className="group overflow-hidden relative h-[15rem] aspect-video rounded-lg shadow-2xl ">
          <Image src={picture ?? organizationPlaceholder} alt={name} fill className="object-cover rounded-lg" />
          <div className="absolute bottom-0 h-20 w-full bg-white bg-opacity-90 px-4 flex items-center justify-center">
            <p className="mb-2 text-center line-clamp-3 text-sm font-semibold" title={name}>{name}</p>
          </div>
          <div className="absolute inset-0 items-center bg-teal-700 opacity-0 transition duration-300 ease-in-out group-hover:opacity-70 flex text-white">
            <p className="text-sm w-full text-center p-2 ">{description}</p>
          </div>
        </div>
      </Link>
      <Link href={`/${orgId}/join`}>
        <ActionButton size="sm" className="absolute top-0 left-0">Join</ActionButton>
      </Link>
    </div>
  );
}