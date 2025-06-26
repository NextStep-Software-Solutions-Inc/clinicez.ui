// app/api/auth/[auth0]/route.js
import { handleAuth, handleLogin, handleLogout, handleCallback } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';

const audience = process.env.AUTH0_AUDIENCE;
const scope = process.env.AUTH0_SCOPE;

export const GET = handleAuth({
  async callback(req: NextApiRequest, res: NextApiResponse) {
    try {
      const { redirectUri } = getUrls(req);
      await handleCallback(req, res, { redirectUri: redirectUri });
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'status' in error && 'message' in error) {
        const err = error as { status?: number; message?: string };
        res.status(err.status || 500).end(err.message);
      } else {
        res.status(500).end('An unknown error occurred');
      }
    }
  },
  async login(req: NextApiRequest, res: NextApiResponse) {
    try {
      const { redirectUri, returnTo } = getUrls(req);

      await handleLogin(req, res, {
        authorizationParams: {
          audience: audience,
          scope: scope,
          redirect_uri: redirectUri
        },
        returnTo: returnTo
      });
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'status' in error && 'message' in error) {
        const err = error as { status?: number; message?: string };
        res.status(err.status || 500).end(err.message);
      } else {
        res.status(500).end('An unknown error occurred');
      }
    }
  },

  async sigup (req: NextApiRequest, res: NextApiResponse) {
    try { 
      const { redirectUri } = getUrls(req);
      await handleLogin(req, res, {
        authorizationParams: {
          login_hint: 'signup',
          redirect_uri: redirectUri
        }
      });
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'status' in error && 'message' in error) {
        const err = error as { status?: number; message?: string };
        res.status(err.status || 500).end(err.message);
      } else {
        res.status(500).end('An unknown error occurred');
      }
    }
  },
  async logout(req: NextApiRequest, res: NextApiResponse) {
    const { returnTo } = getUrls(req);
    await handleLogout(req, res, {
      returnTo: returnTo
    });
  }
});

function getUrls(req: NextApiRequest) {
  const host = req.headers['host'];
  const protocol = process.env.VERCEL_URL ? 'https' : 'http';
  const redirectUri = `${protocol}://${host}/api/auth/callback`;
  const returnTo = `${protocol}://${host}`;
  return {
    redirectUri,
    returnTo
  };
}