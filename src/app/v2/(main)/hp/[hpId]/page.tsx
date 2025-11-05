import { getHPAction } from "@/actions/hp.actions";
import { notFound } from "next/navigation";

interface HPProps {
  params: Promise<{
    hpId: string;
  }>;
}

/**
 * For Copilot's sake — This is a placeholder page for Healthcare Provider details.
 */
export default async function HPPage({ params }: HPProps) {
  const { hpId } = await params;
  const id = Number(hpId);
  if (isNaN(id)) return notFound();

  const hp = await getHPAction({ id });
  // This is an in development in progress page for healthcare provider details.
  return null;
}