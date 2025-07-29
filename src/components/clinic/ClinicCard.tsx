import Image from "next/image";
import clinicPlaceholder from "@public/assets/organization_placeholder.jpg";
import Link from "next/link";
import { GetClinics } from "@/actions/clinics/clinic.action";

interface ClinicCardProps {
  clinic: NonNullable<GetClinics["data"]>[number]
}

export async function ClinicCard({ clinic }: ClinicCardProps) {
  const {  clinicUid, name, description, logo, customUrl } = clinic;

  return (
    <div className="relative group/join hover:scale-105 hover:z-50 transition-all">
      <Link href={customUrl ? customUrl: `/clinics/${clinicUid}`} >
        <div className="overflow-hidden relative h-[15rem] aspect-video rounded-lg shadow-2xl ">
          <Image src={logo ?? clinicPlaceholder} alt={name} fill className="object-scale-down rounded-lg" />
          
        </div>
      </Link>
      <div className="invisible group-hover/join:visible transition-all duration-300">
        <div className="rounded-b-lg absolute bottom-0 h-20 w-full bg-white bg-opacity-90 px-4 flex items-center justify-center">
          <p className="mb-2 text-center line-clamp-3 text-sm font-semibold" title={name}>{name}</p>
        </div>
      </div>
    </div>
  );
}