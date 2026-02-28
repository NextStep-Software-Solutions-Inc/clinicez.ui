import { Metadata } from "next";
import { getCachedSession } from "@actions/session.action";
import { redirect } from "next/navigation";
import PhysicalExaminationClient from "./PhysicalExaminationClient";

export const metadata: Metadata = {
  title: "Physical Examination",
  description: "Visual acuity and physical examination results",
};

interface PhysicalExaminationPageProps {
  params: Promise<{
    user: string;
  }>;
}

export default async function PhysicalExaminationPage(
  props: PhysicalExaminationPageProps
) {
  const params = await props.params;
  const session = await getCachedSession();

  if (!session) {
    redirect("/sign-in");
  }

  const userId = decodeURI(params.user);

  return <PhysicalExaminationClient userId={userId} />;
}
