import { NextFetchEvent, NextMiddleware, NextRequest, NextResponse } from "next/server";

export class MiddlewareStack {
  private stack: NextMiddleware[] = [];

  use(middleware: NextMiddleware) {
    this.stack.push(middleware);
  }

  async execute(req: NextRequest, event: NextFetchEvent): Promise<Response | NextResponse | undefined> {
    let currentRequest = req;
    let currentResponse: Response | NextResponse | undefined;

    for (const middleware of this.stack) {
      if (middleware) {
        const result = await middleware(currentRequest, event);

        // If middleware returns a response, store it and potentially stop
        if (result) {
          currentResponse = result;

          // If the response is not a NextResponse.next(), stop the chain
          // NextResponse.next() typically has no body and continues the chain
          if (result.status !== 200 || !(result instanceof NextResponse && result.body === null)) {
            return result;
          }
        }
      }
    }

    return currentResponse;
  }

  // Simple chaining approach - just run each middleware in sequence
  private createChain(): NextMiddleware {
    return async (req: NextRequest, event: NextFetchEvent) => {
      return this.execute(req, event);
    };
  }

  // Get the composed middleware function
  getComposedMiddleware(): NextMiddleware {
    return this.createChain();
  }
}
