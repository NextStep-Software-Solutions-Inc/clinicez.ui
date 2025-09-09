import { getGoogleAuthTokens } from "@actions/google/auth.action";
import React from "react";

export default async function PlaygroundPage(
  props: {searchParams: Promise<{
      code: string;
      scope: string;
  }>}
) {
  const searchParams = await props.searchParams;
  const { code, scope } = searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  const token = await getGoogleAuthTokens(code, `${baseUrl}/api/google/code`);
  return (
    <div>
      {JSON.stringify(token)}
      <h1>Playground</h1>
    </div>
  );
}
