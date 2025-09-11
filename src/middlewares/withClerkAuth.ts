import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

interface AuthContext {
  userId: string;
}

interface RouteContext<T extends Record<string, unknown> = {}> {
  params: Promise<T>;
  auth: AuthContext;
}

interface OptionalRouteContext<T extends Record<string, unknown> = {}> {
  params: Promise<T>;
  auth: AuthContext | null;
}

export const withClerkAuth = <T extends Record<string, unknown> = {}>(
  handler: (req: NextRequest, context: RouteContext<T>) => Promise<NextResponse>
) => {
  return async (req: NextRequest, context: { params: Promise<T> }) => {
    try {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const authContext: RouteContext<T> = {
        params: context.params,
        auth: { userId }
      };

      return await handler(req, authContext);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
};

export const withClerkAuthOptional = <T extends Record<string, unknown> = {}>(
  handler: (req: NextRequest, context: OptionalRouteContext<T>) => Promise<NextResponse>
) => {
  return async (req: NextRequest, context: { params: Promise<T> }) => {
    try {
      const { userId } = await auth();

      const authContext: OptionalRouteContext<T> = {
        params: context.params,
        auth: userId ? { userId } : null
      };

      return await handler(req, authContext);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
};
