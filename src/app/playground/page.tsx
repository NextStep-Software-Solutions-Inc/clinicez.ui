import { getGoogleAuthTokens } from "@actions/google/auth.action";
import React from "react";

export default  async function PlaygroundPage({searchParams}: {searchParams: {
    code: string;
    scope: string;
}}) {
  const { code, scope } = searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  const token = await getGoogleAuthTokens(code, `${baseUrl}/api/google/code`);
  return (
    <div>
      {JSON.stringify(token)}
      <h1>Playground</h1>
    </div>
  );
}
