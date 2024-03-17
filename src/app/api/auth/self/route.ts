import { withMiddlewareAuthRequired } from "@auth0/nextjs-auth0/edge";

export const GET = withMiddlewareAuthRequired(async () => {
    return Response.json(process.env);
});