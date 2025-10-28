import { getHPAction } from "@/actions/hp.actions";
import notFound from "@/app/(main)/not-found";

interface HPProps {
  params: Promise<{
    hpId: string;
  }>;
}

export default async function HPPage({ params }: HPProps) {
  const { hpId } = await params;
  const id = Number(hpId);
  if (isNaN(id)) return notFound();

  const hp = await getHPAction({ id });
}