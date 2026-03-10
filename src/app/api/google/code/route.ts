import { exchangeGoogleCode } from "@/actions/google/auth.action";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    redirect(`${baseUrl}/settings/integrations?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    redirect(`${baseUrl}/settings/integrations?error=no_code`);
  }

  const success = await exchangeGoogleCode(code);

  if (success) {
    redirect(`${baseUrl}/settings/integrations?connected=true`);
  } else {
    redirect(`${baseUrl}/settings/integrations?error=exchange_failed`);
  }
};