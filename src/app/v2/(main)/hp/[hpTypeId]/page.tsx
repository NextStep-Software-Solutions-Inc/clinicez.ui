import { getHPsAction } from "@/actions/hp.actions";
import { notFound } from "next/navigation";

interface Props {
  params: {
    hpTypeId: string;
  };
}

export default async function HPByTypePage({ params }: Props) {
  const id = Number(params.hpTypeId);
  if (isNaN(id)) return notFound();

  const hps = await getHPsAction({ hpTypeId: id });

  // TOOD: Add healthcare provider profiles
  return (
    <div className="container mx-auto px-8 py-8 max-w-7xl space-y-8">
        To be added soon!
    </div>
  );
}
