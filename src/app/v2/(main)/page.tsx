import { getCachedSession } from "@/actions/session.action";
import { redirect } from "next/navigation";

export default async function HomePageV2() {
  // Redirect to root page, which will handle version selection
  redirect("/");
}