import { withApiAuthRequired } from "@auth0/nextjs-auth0";

export const GET = withApiAuthRequired(async () => {
  return Response.json(process.env);
});