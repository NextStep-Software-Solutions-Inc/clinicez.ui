import { OrganizationCard } from '@components/OrganizationCard';
import organizations from '@public/organizations.json';

export default async function Organizations() {
    return (
        <div className="w-full max-w-screen-xl mx-auto relative px-10">
            <div className="w-full text-center text-teal-500 text-3xl mb-5 font-bold">Partner Organizations</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-8 mt-8"> {/* Changed the grid layout */}
                
                {organizations.map((organization, index) => (
                    <OrganizationCard
                        key={index}
                        url={organization.url}
                        name={organization.name}
                        imageSrc={organization.imageSrc}
                        details={organization.details}
                    />
                ))}
            </div>
        </div>
    );
}








