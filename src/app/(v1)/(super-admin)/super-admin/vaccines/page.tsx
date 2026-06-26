import { getVaccinesAction } from "@/actions/vaccines/get-vaccines.action";
import { VaccinesClient } from "./client";
export default async function VaccinesPage() {
    const vaccines = await getVaccinesAction(true);

    return (
        <div className="space-y-6">
            <div className="border-b pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Vaccines Management
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage vaccines and their PhilHealth code mappings.
                    </p>
                </div>
            </div>
            
            <VaccinesClient initialData={vaccines.data || []} />
        </div>
    );
}
