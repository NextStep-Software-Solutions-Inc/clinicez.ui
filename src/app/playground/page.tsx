import { getGoogleAuthTokens } from "@actions/google/auth.action";
import React from "react";

export default  async function PlaygroundPage({searchParams}: {searchParams: {
    code: string;
    scope: string;
}}) {
  const { code, scope } = searchParams;
  console.log({code, scope});
  const token = await getGoogleAuthTokens(searchParams.code, "http://localhost:3000/api/google/api");
  console.log(token);
  return (
    <div>
      {JSON.stringify(token)}
      <h1>Playground</h1>
    </div>
  );
}
